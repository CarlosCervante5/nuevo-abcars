<?php

namespace App\Console\Commands;

use App\Models\EventMultimedia;
use App\Models\MarketingCampaign;
use App\Models\MarketingEvent;
use App\Models\MarketingPost;
use App\Models\MarketingPromotion;
use App\Models\PointImage;
use App\Models\PostContent;
use App\Models\Reward;
use App\Models\UserProfile;
use App\Models\VehicleImage;
use Cloudinary\Cloudinary;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Http;
use App\Models\Quiz;
use App\Models\Valuations\ValuationImage;
use App\Models\Valuations\ValuationRepair;

class MigrateImagesToCloudinary extends Command
{
    protected $signature = 'images:migrate-to-cloudinary
                            {--dry-run : Listar registros que se migrarían sin modificar}
                            {--limit= : Límite de registros a procesar por tipo}';

    protected $description = 'Migra imágenes desde URLs S3/CloudFront a Cloudinary y actualiza la BD (una sola ejecución)';

    protected string $s3UrlPrefix;

    protected Cloudinary $cloudinary;

    /** @var array{table: string, model: class-string<Model>, urlFields: array<string>, folderEnv: string, folderSuffix: ?callable} */
    protected array $config;

    public function __construct(Cloudinary $cloudinary)
    {
        parent::__construct();
        $this->cloudinary = $cloudinary;
    }

    public function handle(): int
    {
        $this->s3UrlPrefix = rtrim(env('AWS_CLOUDFRONT_URL', ''), '/');
        if (empty($this->s3UrlPrefix)) {
            $this->error('AWS_CLOUDFRONT_URL no está definido en .env');
            return self::FAILURE;
        }

        $this->buildConfig();

        $dryRun = $this->option('dry-run');
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;

        if ($dryRun) {
            $this->info('[DRY RUN] No se modificará la base de datos ni se subirán archivos.');
        }

        $totalProcessed = 0;
        $totalMigrated = 0;
        $totalSkipped = 0;
        $totalErrors = 0;

        foreach ($this->config as $key => $item) {
            $this->info('Procesando: ' . $key);
            [$processed, $migrated, $skipped, $errors] = $this->migrateSource($item, $dryRun, $limit);
            $totalProcessed += $processed;
            $totalMigrated += $migrated;
            $totalSkipped += $skipped;
            $totalErrors += $errors;
        }

        $this->newLine();
        $this->info("Resumen: procesados={$totalProcessed} migrados={$totalMigrated} omitidos={$totalSkipped} errores={$totalErrors}");
        return $totalErrors > 0 ? self::FAILURE : self::SUCCESS;
    }

    protected function buildConfig(): void
    {
        $prefix = env('DB_TABLE_PREFIX', '');

        $this->config = [
            'vehicle_images' => [
                'table' => $prefix . 'vehicle_images',
                'model' => VehicleImage::class,
                'urlFields' => ['service_image_url'],
                'folderEnv' => 'CLOUDINARY_VEHICLES_FOLDER_BASE',
                'folderSuffix' => fn (VehicleImage $m) => $m->vehicle?->uuid ?? 'unknown',
            ],
            'marketing_campaigns' => [
                'table' => $prefix . 'marketing_campaigns',
                'model' => MarketingCampaign::class,
                'urlFields' => ['image_path'],
                'folderEnv' => 'CLOUDINARY_MAIN_BANNER_FOLDER_BASE',
                'folderSuffix' => null,
            ],
            'marketing_events' => [
                'table' => $prefix . 'marketing_events',
                'model' => MarketingEvent::class,
                'urlFields' => ['image_path'],
                'folderEnv' => 'CLOUDINARY_EVENT_FOLDER_BASE',
                'folderSuffix' => null,
            ],
            'event_multimedia' => [
                'table' => $prefix . 'event_multimedia',
                'model' => EventMultimedia::class,
                'urlFields' => ['multimedia_path'],
                'folderEnv' => 'CLOUDINARY_EVENT_MULTIMEDIA_FOLDER_BASE',
                'folderSuffix' => null,
            ],
            'marketing_promotions' => [
                'table' => $prefix . 'marketing_promotions',
                'model' => MarketingPromotion::class,
                'urlFields' => ['image_path'],
                'folderEnv' => 'CLOUDINARY_PROMOTION_FOLDER_BASE',
                'folderSuffix' => null,
            ],
            'rewards' => [
                'table' => $prefix . 'rewards',
                'model' => Reward::class,
                'urlFields' => ['image_path'],
                'folderEnv' => 'CLOUDINARY_REWARD_FOLDER_BASE',
                'folderSuffix' => null,
            ],
            'point_images' => [
                'table' => $prefix . 'point_images',
                'model' => PointImage::class,
                'urlFields' => ['image_path'],
                'folderEnv' => 'CLOUDINARY_REWARD_POINTS_FOLDER_BASE',
                'folderSuffix' => null,
            ],
            'post_contents' => [
                'table' => $prefix . 'post_contents',
                'model' => PostContent::class,
                'urlFields' => ['content_multimedia_1', 'content_multimedia_2'],
                'folderEnv' => 'CLOUDINARY_POST_CONTENT_FOLDER_BASE',
                'folderSuffix' => null,
            ],
            'marketing_posts' => [
                'table' => $prefix . 'marketing_posts',
                'model' => MarketingPost::class,
                'urlFields' => ['image_path'],
                'folderEnv' => 'CLOUDINARY_BLOGS_FOLDER_BASE',
                'folderSuffix' => null,
            ],
            'user_profiles' => [
                'table' => $prefix . 'user_profiles',
                'model' => UserProfile::class,
                'urlFields' => ['picture'],
                'folderEnv' => 'CLOUDINARY_PROFILE_FOLDER_BASE',
                'folderSuffix' => null,
            ],
            'valuation_images' => [
                'table' => $prefix . 'valuation_images',
                'model' => ValuationImage::class,
                'urlFields' => ['image_path'],
                'folderEnv' => 'CLOUDINARY_VALUATIONS_FOLDER_BASE',
                'folderSuffix' => null,
            ],
            'valuation_repairs' => [
                'table' => $prefix . 'valuation_repairs',
                'model' => ValuationRepair::class,
                'urlFields' => ['image_path'],
                'folderEnv' => 'CLOUDINARY_REPAIR_FOLDER_BASE',
                'folderSuffix' => null,
            ],
            'quizzes' => [
                'table' => $prefix . 'quizzes',
                'model' => Quiz::class,
                'urlFields' => ['image_path'],
                'folderEnv' => 'CLOUDINARY_QUIZZES_FOLDER_BASE',
                'folderSuffix' => null,
            ],
        ];
    }

    protected function isS3Url(?string $url): bool
    {
        if ($url === null || $url === '') {
            return false;
        }
        return str_starts_with($url, $this->s3UrlPrefix);
    }

    /**
     * @param array{table: string, model: class-string, urlFields: array<string>, folderEnv: string, folderSuffix: ?callable} $item
     * @return array{0: int, 1: int, 2: int, 3: int} [processed, migrated, skipped, errors]
     */
    protected function migrateSource(array $item, bool $dryRun, ?int $limit): array
    {
        $modelClass = $item['model'];
        $query = $modelClass::query();
        if ($limit !== null) {
            $query->limit($limit);
        }
        $records = $query->get();
        $processed = 0;
        $migrated = 0;
        $skipped = 0;
        $errors = 0;

        $baseFolder = env($item['folderEnv'], 'abcars_images');

        foreach ($records as $record) {
            foreach ($item['urlFields'] as $field) {
                $url = $record->getAttribute($field);
                if (!$this->isS3Url($url)) {
                    continue;
                }
                $processed++;

                if ($dryRun) {
                    $this->line("  [DRY RUN] {$item['table']} id={$record->getKey()} {$field}");
                    $migrated++;
                    continue;
                }

                $tempPath = null;
                try {
                    $tempPath = $this->downloadToTemp($url);
                    if ($tempPath === null) {
                        $this->warn("  No se pudo descargar: {$url}");
                        $errors++;
                        continue;
                    }
                    $folder = $baseFolder;
                    if (isset($item['folderSuffix']) && is_callable($item['folderSuffix'])) {
                        $folder .= '/' . $item['folderSuffix']($record);
                    }
                    $publicId = 'migrated_' . $record->getKey() . '_' . $field . '_' . time();
                    $upload = $this->cloudinary->uploadApi()->upload($tempPath, [
                        'public_id' => $publicId,
                        'folder' => $folder,
                        'transformation' => [
                            'quality' => 'auto',
                            'fetch_format' => 'jpg',
                        ],
                    ]);
                    $newUrl = $upload['secure_url'] ?? null;
                    if ($newUrl === null) {
                        $errors++;
                        continue;
                    }
                    $record->setAttribute($field, $newUrl);
                    if ($record instanceof VehicleImage && $field === 'service_image_url') {
                        $record->setAttribute('service_public_id', $upload['public_id'] ?? null);
                    }
                    $record->save();
                    $migrated++;
                } catch (\Throwable $e) {
                    $this->warn("  Error: " . $e->getMessage());
                    $errors++;
                } finally {
                    if ($tempPath !== null && file_exists($tempPath)) {
                        @unlink($tempPath);
                    }
                }
            }
        }

        return [$processed, $migrated, $skipped, $errors];
    }

    protected function downloadToTemp(string $url): ?string
    {
        $response = Http::timeout(30)->get($url);
        if (!$response->successful()) {
            return null;
        }
        $tmp = tempnam(sys_get_temp_dir(), 'migrate_img_');
        if ($tmp === false) {
            return null;
        }
        if (file_put_contents($tmp, $response->body()) === false) {
            @unlink($tmp);
            return null;
        }
        return $tmp;
    }
}
