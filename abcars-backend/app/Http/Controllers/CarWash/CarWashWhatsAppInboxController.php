<?php

namespace App\Http\Controllers\CarWash;

use App\Helpers\ApiResponseHelper;
use App\Http\Controllers\Controller;
use App\Models\CarWash\CarWashWhatsAppConversation;
use App\Models\CarWash\CarWashWhatsAppMessage;
use App\Services\CarWash\WhatsApp\CarWashWhatsAppInboundService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CarWashWhatsAppInboxController extends Controller
{
    public function conversations(Request $request)
    {
        $query = CarWashWhatsAppConversation::query()
            ->orderByDesc('last_message_at')
            ->orderByDesc('id');

        if ($request->boolean('needs_human')) {
            $query->where('needs_human', true);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('q')) {
            $q = '%'.$request->string('q').'%';
            $query->where(function ($builder) use ($q) {
                $builder->where('phone', 'like', $q)
                    ->orWhere('customer_name', 'like', $q);
            });
        }

        $perPage = min(100, max(1, (int) $request->input('per_page', 30)));

        return ApiResponseHelper::apiSuccess(200, 'Conversaciones WhatsApp', $query->paginate($perPage));
    }

    public function messages(string $uuid)
    {
        $conversation = CarWashWhatsAppConversation::findByUuid($uuid);
        if (! $conversation) {
            return ApiResponseHelper::apiError('Conversación no encontrada', null, 404, 'CARWASH_WA_CONV_NOT_FOUND');
        }

        $messages = CarWashWhatsAppMessage::query()
            ->where('conversation_id', $conversation->id)
            ->orderBy('id')
            ->limit(200)
            ->get();

        return ApiResponseHelper::apiSuccess(200, 'Mensajes', [
            'conversation' => $conversation,
            'messages' => $messages,
        ]);
    }

    public function reply(Request $request, string $uuid, CarWashWhatsAppInboundService $inbound)
    {
        try {
            $data = $request->validate([
                'body' => 'required|string|max:4000',
            ]);

            $conversation = CarWashWhatsAppConversation::findByUuid($uuid);
            if (! $conversation) {
                return ApiResponseHelper::apiError('Conversación no encontrada', null, 404, 'CARWASH_WA_CONV_NOT_FOUND');
            }

            $inbound->sendAndStore($conversation, $data['body']);

            return ApiResponseHelper::apiSuccess(200, 'Respuesta enviada', $conversation->fresh());
        } catch (ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Throwable $e) {
            return ApiResponseHelper::apiError('Error al responder', $e->getMessage(), 500, 'CARWASH_WA_REPLY');
        }
    }

    public function updateHandoff(Request $request, string $uuid)
    {
        try {
            $data = $request->validate([
                'needs_human' => 'required|boolean',
            ]);

            $conversation = CarWashWhatsAppConversation::findByUuid($uuid);
            if (! $conversation) {
                return ApiResponseHelper::apiError('Conversación no encontrada', null, 404, 'CARWASH_WA_CONV_NOT_FOUND');
            }

            $conversation->needs_human = (bool) $data['needs_human'];
            $meta = $conversation->meta ?? [];
            $meta['handoff_updated_at'] = now()->toIso8601String();
            $meta['handoff_by'] = $request->user()?->id;
            $conversation->meta = $meta;
            $conversation->save();

            return ApiResponseHelper::apiSuccess(200, 'Handoff actualizado', $conversation);
        } catch (ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Throwable $e) {
            return ApiResponseHelper::apiError('Error al actualizar handoff', $e->getMessage(), 500, 'CARWASH_WA_HANDOFF');
        }
    }
}
