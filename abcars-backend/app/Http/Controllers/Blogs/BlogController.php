<?php

namespace App\Http\Controllers\Blogs;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Blogs\DeleteContentRequest;
use App\Http\Requests\Blogs\DeletePostRequest;
use App\Http\Requests\Blogs\DetailPostRequest;
use App\Http\Requests\Blogs\DetailUrlPostRequest;
use App\Http\Requests\Blogs\SearchPostsRequest;
use App\Http\Requests\Blogs\StoreMarketingPostRequest;
use App\Http\Requests\Blogs\StorePostContentRequest;
use App\Http\Requests\Blogs\UpdateSortPostContentRequest;
use App\Jobs\UploadMarketingPostImage;
use App\Jobs\UploadPostContentImage;
use App\Models\MarketingPost;
use App\Models\PostContent;
use App\Models\UserPost;
use App\Services\BlogService;
use Illuminate\Support\Facades\DB;

class BlogController extends Controller
{

    protected $blogService;

    public function __construct(BlogService $blogService)
    {
        $this->blogService = $blogService;

    }

    /**
     * Encontrar posts.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function searchPublic(SearchPostsRequest $request)
    {
        try {

            $data = $request->validated();

            $posts = $this->blogService->searchPostsPublic($data);
            
            return ApiResponseHelper::apiSuccess(200, 'Posts obtenidos exitosamente', $posts);

        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al obtener la búsqueda de posts', $e->getMessage(), 500, 'GET_POST_SEARCH_ERROR');
        }
    }

    /**
     * Busca post en modo aleatorio
     *
     * @param array $data Datos de búsqueda que incluyen condiciones y paginación.
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator Posts encontrados.
     */
    public function randomSearch()
    {
        // Crear la consulta base
        $query = MarketingPost::query();
        $query->where('status', '!=', 'unpublished');
        
        // Obtener los vehículos con paginación
        $posts = $query->inRandomOrder()->limit(4)->get();


        if($posts->count() == 4){
            return $posts;
        }

        return MarketingPost::inRandomOrder()->where('status', '!=', 'unpublished')->limit(10)->get();

    }

    /**
     * Encontrar posts.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function searchManager(SearchPostsRequest $request)
    {
        try {

            $data = $request->validated();

            $posts = $this->blogService->searchPostsManager($data);
            
            return ApiResponseHelper::apiSuccess(200, 'Posts obtenidos exitosamente', $posts);

        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al obtener la búsqueda de posts', $e->getMessage(), 500, 'GET_POST_SEARCH_ERROR');
        }
    }

    /**
     * Crear post.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(StoreMarketingPostRequest $request )
    {
        try {

            $user = auth()->user();

            $data = $request->validated();

            $url_name = $data['title'];

            $seo_url = $this->generateSeoUrl($url_name);

            $existingPost = MarketingPost::where('url_name', $seo_url)->exists();

            if ($existingPost) {
                return ApiResponseHelper::apiError('Ya existe un post con el mismo nombre de URL.', null, 400, null );
            }

            $post = MarketingPost::create([
                'title' => $data['title'],
                'category' => $data['category'],
                'sub_category' => $data['sub_category'],
                'key_words' => $data['key_words'],
                'url_name' => $seo_url
            ]);

            UserPost::create([
                'user_role_name' => 'blog_manager',
                'user_id' => $user->id,
                'post_id' => $post->id
            ]);

            $image = $request->file('image');

            $path = $image->store('temp_images');

            UploadMarketingPostImage::dispatchSync($path, $post, $image->getClientOriginalName());

            return ApiResponseHelper::apiSuccess(200, 'Posts creado exitosamente');

        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al crear el post', $e->getMessage(), 500, 'CREATE_POST_ERROR');
        }
    } 

    /**
     * Mostrar post mediante uuid.
     * 
     * @param  \App\Http\Requests\Users\DetailPostRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function detail( DetailPostRequest $request)
    {
        try {
            
            $data = $request->validated();

            $post = MarketingPost::findByUuid($data['post_uuid'], ['contents']);

            return ApiResponseHelper::apiSuccess(200, 'Post encontrado', $post);

        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al obtener el post', $e->getMessage(), 500, 'GET_POST_ERROR');
        }
    }


    /**
     * Mostrar post mediante uuid.
     * 
     * @param  \App\Http\Requests\Users\DetailPostRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function detailURLManager( DetailUrlPostRequest $request)
    {
        try {
            
            $data = $request->validated();

            $post = MarketingPost::where('url_name', $data['url_name'])->with('contents')->first();

            if (!$post) {
                return ApiResponseHelper::apiError('No existe un post con el nombre de URL proporcionado', null, 400, null );
            }

            return ApiResponseHelper::apiSuccess(200, 'Post encontrado', $post);

        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al obtener el post', $e->getMessage(), 500, 'GET_POST_ERROR');
        }
    }


    /**
     * Cambiar status del post mediante uuid.
     * 
     * @param  \App\Http\Requests\Users\DetailPostRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function statusUpdate( DetailPostRequest $request)
    {
        try {
            
            $data = $request->validated();

            $post = MarketingPost::findByUuid($data['post_uuid']);

            if($post->status === 'unpublished'){

                $post->update(['status' => 'published']);

            } else {

                $post->update(['status' => 'unpublished']);
            }

            return ApiResponseHelper::apiSuccess(200, 'Post encontrado', $post);

        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al obtener el post', $e->getMessage(), 500, 'GET_POST_ERROR');
        }
    }

    /**
     * Mostrar post mediante uuid.
     * 
     * @param  \App\Http\Requests\Users\DetailPostRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function detailUrl( DetailUrlPostRequest $request)
    {
        try {
            
            $data = $request->validated();

            $post = MarketingPost::where('url_name', $data['url_name'])->where('status','published')->with('contents')->first();

            if (!$post) {
                return ApiResponseHelper::apiError('No existe un post con el nombre de URL proporcionado', null, 400, null );
            }

            return ApiResponseHelper::apiSuccess(200, 'Post encontrado', $post);

        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al obtener el post', $e->getMessage(), 500, 'GET_POST_ERROR');
        }
    }

    /**
     * Crear contenido para un post.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function createContent(StorePostContentRequest $request )
    {
        try {

            $data = $request->validated();

            $post = MarketingPost::findByUuid($data['post_uuid']);
            
            $content = PostContent::create([
                'content_type' => $data['content_type'],
                'content_text' => $data['content_text'],
                'post_id' => $post->id
            ]);
            
            if (isset($data['content_multimedia_1']) && $request->hasFile('content_multimedia_1')) {

                $image = $request->file('content_multimedia_1');
                $path = $image->store('temp_images');

                UploadPostContentImage::dispatch($path, $content, $image->getClientOriginalName(), 'content_multimedia_1');

            }

            if (isset($data['content_multimedia_2']) && $request->hasFile('content_multimedia_2')) {

                $image = $request->file('content_multimedia_2');
                $path = $image->store('temp_images');

                UploadPostContentImage::dispatch($path, $content, $image->getClientOriginalName(), 'content_multimedia_2');

            }

            return ApiResponseHelper::apiSuccess(200, 'Contenido creado exitosamente');

        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al crear el contenido', $e->getMessage(), 500, 'CREATE_POST_CONTENT_ERROR');
        }
    } 

    /**
     * Eliminar post mediante uuid.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function delete(DeletePostRequest $request)
    {
        try {

            $data = $request->validated();

            $post = MarketingPost::findByUuid($data['post_uuid']);

            if ($post) {
                
                $post->delete();

                return ApiResponseHelper::apiSuccess(200, 'Post eliminado exitosamente');

            } else {
                return ApiResponseHelper::apiError('La post no existe', 'No existe el id: '. $data['uuid'] ,404, 'GET_POST_ERROR');
            }

        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al obtener el post', $e->getMessage(), 500, 'GET_POST_ERROR');
        }
    }

    /**
     * Eliminar contenido de post mediante uuid.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteContent(DeleteContentRequest $request)
    {
        try {

            $data = $request->validated();

            $content = PostContent::findByUuid($data['content_uuid']);

            if ($content) {
                
                $content->delete();

                return ApiResponseHelper::apiSuccess(200, 'Contenido eliminado exitosamente');

            } else {
                return ApiResponseHelper::apiError('La contenido no existe', 'No existe el id: '. $data['content_uuid'] ,404, 'GET_POST_CONTENT_ERROR');
            }

        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al obtener el contenido', $e->getMessage(), 500, 'GET_CONTENT_POST_ERROR');
        }
    }


    /**
     * Actualizar orden de los contenidos
     *
     * @param  \App\Http\Requests\Blogs\UpdateSortPostContentRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sortUpdate( UpdateSortPostContentRequest $request)
    {
        try {

            $data = $request->validated();

            DB::transaction(function () use ($data) {
                foreach ($data['content_order'] as $order) {
                    PostContent::where('uuid', $order['uuid'])->update(['sort_id' => $order['sort_id']]);
                }
            });

            return ApiResponseHelper::apiSuccess(200, 'Contenido reordenado exitosamente');

        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al obtener el contenido del post', $e->getMessage(), 500, 'GET_POST_CONTENT_ERROR');
        }
    }

    protected function generateSeoUrl($title, $maxWords = 5) {
        // Convertir a minúsculas y eliminar caracteres especiales
        $title = strtolower($title);
        $title = preg_replace('/[^a-z0-9\s]/', '', $title); // Solo letras, números y espacios

        // Palabras a excluir para URLs más limpias
        $stopWords = ['de', 'la', 'el', 'los', 'las', 'y', 'en', 'para', 'del'];

        // Dividir en palabras, eliminar stopWords y limitar el número de palabras
        $words = explode(' ', trim($title));
        $filteredWords = array_diff($words, $stopWords); // Filtrar palabras irrelevantes
        $selectedWords = array_slice($filteredWords, 0, $maxWords); // Limitar cantidad

        // Unir palabras con guiones
        return implode('-', $selectedWords);
    }

}
