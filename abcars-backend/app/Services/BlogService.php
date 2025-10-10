<?php

namespace App\Services;

use App\Models\MarketingPost;

class BlogService
{   
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    /**
     * Busca posts en base a los criterios proporcionados.
     *
     * @param array $data Datos de búsqueda que incluyen condiciones y paginación.
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator Posts encontrados.
     */
    public function searchPostsPublic($data)
    {
        // Crear la consulta base
        $query = MarketingPost::query();

        $keywordCondition = $this->keywordCondition($data['keyword']);
        
        if ($keywordCondition) {
            $query->where($keywordCondition);
        }

        $query->where('status', '!=', 'unpublished');

        $posts = $query->paginate($data['paginate']);

        return $posts;
    }

    /**
     * Crea una condición para buscar vehículos por una palabra clave en múltiples campos.
     *
     * @param string $keyword Palabra clave para buscar.
     * @return \Closure Función de condición para usar en la consulta.
     */
    public function keywordCondition($keyword)
    {
        // Si el keyword está vacío, no retornar una condición
        if (empty($keyword)) {
            return null;
        }

        // Formatear el keyword para uso en LIKE
        $keyword = '%' . $keyword . '%';

        return function ($query) use ($keyword) {
            $query->where(function ($query) use ($keyword) {
                $query->where('title', 'LIKE',  $keyword)
                    ->orWhere('url_name', 'LIKE', $keyword)
                    ->orWhere('category', 'LIKE', $keyword)
                    ->orWhere('sub_category', 'LIKE', $keyword)
                    ->orWhere('key_words', 'LIKE', $keyword);
            });
        };
    }

    /**
     * Busca posts en base a los criterios proporcionados.
     *
     * @param array $data Datos de búsqueda que incluyen condiciones y paginación.
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator Posts encontrados.
     */
    public function searchPostsManager($data)
    {
        // Crear la consulta base
        $query = MarketingPost::query();

        $keywordCondition = $this->keywordCondition($data['keyword']);
        
        if ($keywordCondition) {
            $query->where($keywordCondition);
        }

        $posts = $query->paginate($data['paginate']);

        return $posts;
    }


}
