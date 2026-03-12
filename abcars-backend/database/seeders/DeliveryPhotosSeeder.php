<?php

namespace Database\Seeders;

use App\Models\DeliveryPhoto;
use Illuminate\Database\Seeder;

class DeliveryPhotosSeeder extends Seeder
{
    /**
     * Registros de ejemplo para el carrusel de entregas.
     * Usa imágenes placeholder; en producción se suben desde el panel del gestor.
     */
    public function run(): void
    {
        $photos = [
            [
                'caption' => 'Entrega BMW Serie 3 - Cliente satisfecho',
                'sort_order' => 1,
                'service_image_url' => 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80',
            ],
            [
                'caption' => 'Entrega Toyota Camry - Familia feliz',
                'sort_order' => 2,
                'service_image_url' => 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80',
            ],
            [
                'caption' => 'Entrega Honda Civic - Nuevo dueño',
                'sort_order' => 3,
                'service_image_url' => 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80',
            ],
            [
                'caption' => 'Entrega Nissan Versa - Sonrisas garantizadas',
                'sort_order' => 4,
                'service_image_url' => 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
            ],
            [
                'caption' => 'Entrega Volkswagen Jetta',
                'sort_order' => 5,
                'service_image_url' => 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80',
            ],
        ];

        foreach ($photos as $data) {
            DeliveryPhoto::firstOrCreate(
                ['caption' => $data['caption']],
                [
                    'service_image_url' => $data['service_image_url'],
                    'sort_order' => $data['sort_order'],
                ]
            );
        }
    }
}
