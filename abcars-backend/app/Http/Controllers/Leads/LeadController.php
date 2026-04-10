<?php

namespace App\Http\Controllers\Leads;

use App\Helpers\ApiResponseHelper;
use App\Helpers\GoogleSheetHelper;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;
use App\Http\Requests\Leads\StoreAskInfomationRequest;
use App\Http\Requests\Leads\StoreCarCareRequest;
use App\Http\Requests\Leads\StoreReceptionRequest;
use App\Http\Requests\Leads\StoreRidersQuiz;
use App\Http\Requests\Leads\StoreFinancingRequest;
use App\Http\Requests\Leads\StoreTestDriveRequest;
use App\Http\Requests\Leads\StoreOfferRequest;
use App\Http\Requests\Leads\StoreValuationRequest;
use App\Mail\ReceptionNotification;
use App\Models\Analytics\FormSubmission;
use App\Models\Leads\ReceptionForm;
use App\Models\Leads\RidersQuiz;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class LeadController extends Controller
{
    private function trackFormSubmission(string $formType, array $metadata, Request $request): void
    {
        try {
            FormSubmission::create([
                'form_type' => $formType,
                'metadata' => $metadata,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        } catch (\Exception $e) {
            Log::warning('Analytics form submission tracking failed', ['error' => $e->getMessage()]);
        }
    }

    public function askInfomation(StoreAskInfomationRequest $request){

        try {

            $data = $request->validated();

            $leadData = [
                'formType' => 'askInformation', // Identificador del formulario
                'nombre'   => $request->name,
                'apellido' => $request->lastname,
                'telefono' => $request->phone_1,
                'correo'   => $request->email,
            ];
        
            $additionalData = [
                'mensaje' => $request->comments,
                'fecha'   => now()->format('d-m-y H:i:s'),
            ];

            $webhookUrl = GoogleSheetHelper::getWebhookUrl('GOOGLE_SHEET_WEBHOOK_ASK_INFORMATION');

            $vehicles = Vehicle::vehiclesByUuids($data['vehicles_uuid'], ['brand']);

            $vehicles_uuid = $vehicles->pluck('uuid')->join(', ');
            $vehicleNames = $vehicles->pluck('name')->join(', ');
            $vehicleCategories = $vehicles->pluck('category')->join(', ');
            $brandNames = $vehicles->pluck('brand.name')->join(', ');
            
            $vehicleData = [
                'vehículos' => $vehicleNames,
                'marcas' => $brandNames,
                'Nuevo/Semi' => $vehicleCategories,
            ];

            $data['vehicles_uuid'] = $vehicles_uuid;

            // Crear una nueva líneas de marca
            // AskInformation::create($data);

            GoogleSheetHelper::sendToGoogleSheet($webhookUrl, $leadData, $vehicleData, $additionalData);

            $this->trackFormSubmission('ask_information', array_merge($leadData, $vehicleData, $additionalData), $request);

            // Retornar respuesta exitosa
            return ApiResponseHelper::apiSuccess(201, 'Solicitud de información almacenada correctamente.');

        } catch (ValidationException $e) {
            // Manejar errores de validación y retornar respuesta de error
            return ApiResponseHelper::validationError($e);

        } catch (\Exception $e) {
            // Manejar otros errores y retornar respuesta de error
            return ApiResponseHelper::apiError('Error al crear la solicitud de información', $e->getMessage(), 500, 'CREATE_ASK_INFORMATION_ERROR');
        }

    }

    public function receptionForm(StoreReceptionRequest $request){

        try {

            $data = $request->validated();

            $reception_form = ReceptionForm::create($data);

            Carbon::setLocale('es');
            $mes_actual = strtoupper(Carbon::now()->isoFormat('MMMM'));
            $fecha = Carbon::parse($data['date']);

            $receptionFormOne = array(
                'formType'              => 'receptionForm', // Identificador del formulario
                'id'                    => $reception_form->id,
                'date'                  => $fecha->format('d/m/Y'),
                'hour'                  => $data['hour'],
                'salesAdvisor'          => $data['salesAdvisor'],
                'brand'                 => strtoupper($data['brand']),
                'departureTime'         => $data['departureTime'],
                'visitType'             => strtoupper($data['visitType']),
                'visitFirsTime'         => strtoupper($data['visitFirsTime']),
                'department'            => strtoupper($data['department']),
                'howFindOut'            => strtoupper($data['howFindOut']),
                'contactSub'            => $data['contactSub'],
                'clientName'            => strtoupper($data['clientName']),
                'clientAge'             => $data['clientAge'],
                'clientPhone'           => $data['clientPhone'],
                'clientEmail'           => $data['clientEmail'],
                'preferredMedium'       => strtoupper($data['preferredMedium']),
                'model'                 => strtoupper($data['model']),
                'year'                  => $data['year'],
                'version'               => strtoupper($data['version']),
                'color'                 => strtoupper($data['color']),
                'accessories'           => strtoupper($data['accessories']),
                'brandSecondOption'     => strtoupper($data['brandSecondOption']),
                'modelSecondOption'     => strtoupper($data['modelSecondOption']),
                'versionSecondOption'   => strtoupper($data['versionSecondOption']),
                'colorSecondOption'     => strtoupper($data['colorSecondOption']),
                'testDrive'             => strtoupper($data['testDrive']),
                'receivedQuote'         => strtoupper($data['receivedQuote']),
                'FAndI'                 => strtoupper($data['FAndI']),
                'leaveCarOnAccount'     => strtoupper($data['leaveCarOnAccount']),
                'customersCurrentCar'   => strtoupper($data['customersCurrentCar']),
                'hostes'                => $data['hostes'],
                'month'                 => $mes_actual,
                'saleType'              => strtoupper($data['saleType']),
                'wasClientProfile'      => strtoupper($data['wasClientProfile']),
                'wasApplicationTaken'   => strtoupper($data['wasApplicationTaken']),
                'financingType'         => strtoupper($data['financingType']),
                'initialInvestment'     => $data['initialInvestment'],
                'monthlyPayment'        => $data['monthlyPayment'],
                'termHowManyMonths'     => $data['termHowManyMonths'],
                'segment'               => strtoupper($data['segment']),
                'idCRM'                 => $data['idCRM'],
                'honorific'             => strtoupper($data['honorific']),
                'contactSalesplace' => $data['contactSalesplace'],
            );

            $receptionFormTwo = array(
                'formType'              => 'receptionForm', // Identificador del formulario
                'id'                     => $reception_form->id,
                'date'                   => $data['date'],
                'hour'                   => $data['hour'],
                'salesAdvisor'           => $data['salesAdvisor'],
                'salesAdvisorAssignment' => $data['salesAdvisor'] ? 'SI' : 'NO',
                'brand'                  => strtoupper($data['brand']),
                'visitType'              => $data['visitType'],
                'visitFirsTime'          => $data['visitFirsTime'],
                'department'             => $data['department'],
                'howFindOut'             => $data['howFindOut'],
                'contactSub'             => $data['contactSub'],
                'clientName'             => $data['clientName'],
                'clientAge'              => $data['clientAge'],
                'clientPhone'            => $data['clientPhone'],
                'clientEmail'            => $data['clientEmail'],
                'preferredMedium'        => $data['preferredMedium'],
                'model'                  => $data['model'],
                'year'                   => $data['year'],
                'version'                => $data['version'],
                'color'                  => $data['color'],
                'accessories'            => $data['accessories'],
                'brandSecondOption'      => $data['brandSecondOption'],
                'modelSecondOption'      => $data['modelSecondOption'],
                'versionSecondOption'    => $data['versionSecondOption'],
                'colorSecondOption'      => $data['colorSecondOption'],
                'testDrive'              => $data['testDrive'],
                'receivedQuote'          => $data['receivedQuote'],
                'FAndI'                  => $data['FAndI'],
                'leaveCarOnAccount'      => $data['leaveCarOnAccount'],
                'customersCurrentCar'    => $data['customersCurrentCar'],
                'channel'                => 'Control piso',
                'hostes'                 => $data['hostes'],
                'month'                  => $mes_actual,
                'saleType'               => strtoupper($data['saleType']),
                'wasClientProfile'       => strtoupper($data['wasClientProfile']),
                'wasApplicationTaken'    => strtoupper($data['wasApplicationTaken']),
                'financingType'          => strtoupper($data['financingType']),
                'initialInvestment'      => $data['initialInvestment'],
                'monthlyPayment'         => $data['monthlyPayment'],
                'termHowManyMonths'      => $data['termHowManyMonths'],
                'segment'                => strtoupper($data['segment']),
                'idCRM'                  => $data['idCRM'],
                'honorific'              => $data['honorific'],
            );

            $webhookUrl_1 = GoogleSheetHelper::getWebhookUrl('GOOGLE_SHEET_WEBHOOK_RECEPTION_1');

            GoogleSheetHelper::sendToGoogleSheet($webhookUrl_1, $receptionFormOne);

            $webhookUrl_2 = GoogleSheetHelper::getWebhookUrl('GOOGLE_SHEET_WEBHOOK_RECEPTION_2');

            GoogleSheetHelper::sendToGoogleSheet($webhookUrl_2, $receptionFormTwo);

            $this->trackFormSubmission('reception_form', $receptionFormTwo, $request);

            // Retornar respuesta exitosa
            return ApiResponseHelper::apiSuccess(201, 'Formulario de recepcion almacenado correctamente.');

        } catch (ValidationException $e) {
            // Manejar errores de validación y retornar respuesta de error
            return ApiResponseHelper::validationError($e);

        } catch (\Exception $e) {
            // Manejar otros errores y retornar respuesta de error
            return ApiResponseHelper::apiError('Error al crear el formulario de recepcion', $e->getMessage(), 500, 'CREATE_RECEPTION_FORM_ERROR');
        }
    }

    public function ridersQuiz(StoreRidersQuiz $request){

        try {

            $data = $request->validated();

            RidersQuiz::create($data);

            $fecha = Carbon::now()->format('Y-m-d H:i:s');

            $google_sheet = array(
                'fecha'    => $fecha,
                'nombre'   => $data['name'],
                'telefono' => $data['phone'],
                'correo'   => $data['email'],
                'modelo'   => $data['model'],
                'guantes'  => $data['gloves'],
                'chamarra'  => $data['jacket'],
                'calzado'  => $data['footwear'],
                'casco'  => $data['helmet'],
                'color'  => $data['color'],
            );

            $webhookUrl = GoogleSheetHelper::getWebhookUrl('GOOGLE_SHEET_WEBHOOK_RIDERS_QUIZ');

            GoogleSheetHelper::sendToGoogleSheet($webhookUrl, $google_sheet);

            $this->trackFormSubmission('riders_quiz', $google_sheet, $request);

            // Retornar respuesta exitosa
            return ApiResponseHelper::apiSuccess(201, 'Cuestionario de riders almacenado correctamente.');

        } catch (ValidationException $e) {
            // Manejar errores de validación y retornar respuesta de error
            return ApiResponseHelper::validationError($e);

        } catch (\Exception $e) {
            // Manejar otros errores y retornar respuesta de error
            return ApiResponseHelper::apiError('Error al crear el cuestionario de riders', $e->getMessage(), 500, 'CREATE_RIDERS_QUIZ_ERROR');
        }
    }

    public function carCare(StoreCarCareRequest $request){

        try {

            $data = $request->validated();

            $fecha = Carbon::now()->format('Y-m-d H:i:s');

            $google_sheet = array(
                'fecha'    => $fecha,
                'nombre'   => $data['name'],
                'telefono' => $data['phone_1'],
                'correo'   => $data['email_1'],
                'modelo'   => $data['model_name'],
                'año'  => $data['year'],
                'sucursal'  => $data['dealership_name'],
                'servicio'  => $data['required_service'],
                'comentarios'  => $data['comments'],
                'marca'  => $data['brand_name'],
                'fecha_cita'  => $data['appointment_date'],
            );

            $webhookUrl = GoogleSheetHelper::getWebhookUrl('GOOGLE_SHEET_WEBHOOK_CAR_CARE');

            GoogleSheetHelper::sendToGoogleSheet($webhookUrl, $google_sheet);

            $this->trackFormSubmission('car_care', $google_sheet, $request);

            // Retornar respuesta exitosa
            return ApiResponseHelper::apiSuccess(201, 'Cuestionario de care care almacenado correctamente.');

        } catch (ValidationException $e) {
            // Manejar errores de validación y retornar respuesta de error
            return ApiResponseHelper::validationError($e);

        } catch (\Exception $e) {
            // Manejar otros errores y retornar respuesta de error
            return ApiResponseHelper::apiError('Error al crear el cuestionario de care care', $e->getMessage(), 500, 'CREATE_CARE_CARE_ERROR');
        }
    }

    public function receptionNotification(){

        Mail::to('financiera.pachuca@bmwvecsa.com')->send(new ReceptionNotification);

        return ApiResponseHelper::apiSuccess(201, 'Notificación enviada.');

    }

    /**
     * Procesar solicitud de financiamiento
     */
    public function financing(StoreFinancingRequest $request)
    {
        try {
            $data = $request->validated();

            // Construir comentarios con información adicional que no tiene campo específico
            $comments = [];
            if (!empty($data['address'])) {
                $comments[] = "Dirección: " . $data['address'];
            }
            if (!empty($data['occupation'])) {
                $comments[] = "Ocupación: " . $data['occupation'];
            }
            if (!empty($data['monthly_income'])) {
                $comments[] = "Ingresos mensuales: " . $data['monthly_income'];
            }
            if (!empty($data['company'])) {
                $comments[] = "Empresa: " . $data['company'];
            }
            if (!empty($data['job_tenure'])) {
                $comments[] = "Antigüedad en el trabajo: " . $data['job_tenure'];
            }
            if (!empty($data['vehicle_of_interest'])) {
                $comments[] = 'Vehículo de interés: ' . $data['vehicle_of_interest'];
            }
            if (!empty($data['down_payment_percentage'])) {
                $comments[] = "Porcentaje de enganche: " . $data['down_payment_percentage'] . "%";
            }
            if (!empty($data['finance_amount'])) {
                $comments[] = "Monto a financiar: $" . number_format($data['finance_amount'], 2);
            }
            if (!empty($data['comments'])) {
                $comments[] = $data['comments'];
            }
            $fullComments = implode(" | ", $comments);

            // Preparar datos para enviar a Google Sheets
            $googleSheetData = [
                // 'sucursal' => '', // A: Sucursal (vacío por defecto, ajustar si es necesario)
                'sucursal' => $data['city'] ?? '',
                'formType' => 'financing',
                'fecha' => now()->format('Y-m-d H:i:s'),
                'canal' => 'abcars.mx',
                'nombre' => $data['name'],
                'apellido' => $data['last_name'] ?? '',
                'telefono' => $data['phone'],
                'correo' => $data['email'],
                'marca' => $data['vehicle_brand'] ?? '',
                'modelo' => $data['vehicle_model'] ?? '',
                'año' => $data['vehicle_year'] ?? '',
                'precio_vehiculo' => $data['vehicle_price'] ?? '',
                'enganche' => $data['down_payment'] ?? '',
                'mensualidad' => $data['monthly_payment'] ?? '',
                'plazo_meses' => $data['term_months'] ?? '',
                'comentarios' => $fullComments,
            ];

            $webhookUrl = GoogleSheetHelper::getWebhookUrl('GOOGLE_SHEET_WEBHOOK_PRICE_OFFER');
            
            // Enviar al webhook de forma asíncrona para no bloquear la respuesta
            if ($webhookUrl) {
                // Usar dispatch para ejecutar en background sin esperar
                dispatch(function () use ($webhookUrl, $googleSheetData) {
                    try {
                        $result = GoogleSheetHelper::sendToGoogleSheet($webhookUrl, $googleSheetData);
                        Log::info('Financing form sent to Google Sheets', [
                            'url' => $webhookUrl,
                            'success' => $result,
                            'data' => $googleSheetData
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Error sending financing form to Google Sheets', [
                            'url' => $webhookUrl,
                            'error' => $e->getMessage(),
                            'data' => $googleSheetData
                        ]);
                    }
                })->afterResponse();
            } else {
                Log::warning('GOOGLE_SHEET_WEBHOOK_PRICE_OFFER not configured');
            }

            $this->trackFormSubmission('financing', $googleSheetData, $request);

            return ApiResponseHelper::apiSuccess(201, 'Solicitud de financiamiento almacenada correctamente.');

        } catch (ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al crear la solicitud de financiamiento', $e->getMessage(), 500, 'CREATE_FINANCING_ERROR');
        }
    }

    /**
     * Procesar solicitud de prueba de manejo
     */
    public function testDrive(StoreTestDriveRequest $request)
    {
        try {
            $data = $request->validated();

            // Construir comentarios con información adicional
            $comments = [];
            if (!empty($data['comments'])) {
                $comments[] = $data['comments'];
            }
            if (!empty($data['vehicle_uuid'])) {
                $comments[] = "UUID del vehículo: " . $data['vehicle_uuid'];
            }
            $fullComments = implode(" | ", $comments);

            // Preparar datos para enviar a Google Sheets
            $googleSheetData = [
                // 'sucursal' => '', // A: Sucursal (vacío por defecto, ajustar si es necesario)
                'sucursal' => $data['city'] ?? '',
                'formType' => 'testDrive',
                'fecha' => now()->format('Y-m-d H:i:s'),
                'canal' => 'abcars.mx',
                'nombre' => $data['name'],
                'apellido' => $data['last_name'] ?? '',
                'telefono' => $data['phone'],
                'correo' => $data['email'],
                'fecha_preferida' => $data['preferred_date'] ?? '',
                'hora_preferida' => $data['preferred_time'] ?? '',
                'marca' => $data['vehicle_brand'] ?? '',
                'modelo' => $data['vehicle_model'] ?? '',
                'año' => $data['vehicle_year'] ?? '',
                'comentarios' => $fullComments,
            ];

            $webhookUrl = GoogleSheetHelper::getWebhookUrl('GOOGLE_SHEET_WEBHOOK_PRICE_OFFER');
            
            // Enviar al webhook de forma asíncrona para no bloquear la respuesta
            if ($webhookUrl) {
                dispatch(function () use ($webhookUrl, $googleSheetData) {
                    try {
                        $result = GoogleSheetHelper::sendToGoogleSheet($webhookUrl, $googleSheetData);
                        Log::info('Test Drive form sent to Google Sheets', [
                            'url' => $webhookUrl,
                            'success' => $result,
                            'data' => $googleSheetData
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Error sending test drive form to Google Sheets', [
                            'url' => $webhookUrl,
                            'error' => $e->getMessage(),
                            'data' => $googleSheetData
                        ]);
                    }
                })->afterResponse();
            } else {
                Log::warning('GOOGLE_SHEET_WEBHOOK_PRICE_OFFER not configured');
            }

            $this->trackFormSubmission('test_drive', $googleSheetData, $request);

            return ApiResponseHelper::apiSuccess(201, 'Solicitud de prueba de manejo almacenada correctamente.');

        } catch (ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al crear la solicitud de prueba de manejo', $e->getMessage(), 500, 'CREATE_TEST_DRIVE_ERROR');
        }
    }

    /**
     * Procesar oferta de monto
     */
    public function offer(StoreOfferRequest $request)
    {
        try {
            $data = $request->validated();

            // Construir comentarios con información adicional
            $comments = [];
            if (!empty($data['payment_conditions'])) {
                $comments[] = "Condiciones de pago: " . $data['payment_conditions'];
            }
            if (!empty($data['vehicle_uuid'])) {
                $comments[] = "UUID del vehículo: " . $data['vehicle_uuid'];
            }
            if (!empty($data['comments'])) {
                $comments[] = $data['comments'];
            }
            $fullComments = implode(" | ", $comments);

            // Preparar datos para enviar a Google Sheets
            $googleSheetData = [
                // 'sucursal' => '', // A: Sucursal (vacío por defecto, ajustar si es necesario)
                'sucursal' => $data['city'] ?? '',
                'formType' => 'offer',
                'fecha' => now()->format('Y-m-d H:i:s'),
                'canal' => 'abcars.mx',
                'nombre' => $data['name'],
                'apellido' => $data['last_name'] ?? '',
                'telefono' => $data['phone'],
                'correo' => $data['email'],
                'monto_ofrecido' => $data['offer_amount'],
                'marca' => $data['vehicle_brand'] ?? '',
                'modelo' => $data['vehicle_model'] ?? '',
                'año' => $data['vehicle_year'] ?? '',
                'comentarios' => $fullComments,
            ];

            $webhookUrl = GoogleSheetHelper::getWebhookUrl('GOOGLE_SHEET_WEBHOOK_PRICE_OFFER');
            
            // Enviar al webhook de forma asíncrona para no bloquear la respuesta
            if ($webhookUrl) {
                dispatch(function () use ($webhookUrl, $googleSheetData) {
                    try {
                        $result = GoogleSheetHelper::sendToGoogleSheet($webhookUrl, $googleSheetData);
                        Log::info('Offer form sent to Google Sheets', [
                            'url' => $webhookUrl,
                            'success' => $result,
                            'data' => $googleSheetData
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Error sending offer form to Google Sheets', [
                            'url' => $webhookUrl,
                            'error' => $e->getMessage(),
                            'data' => $googleSheetData
                        ]);
                    }
                })->afterResponse();
            } else {
                Log::warning('GOOGLE_SHEET_WEBHOOK_PRICE_OFFER not configured');
            }

            $this->trackFormSubmission('offer', $googleSheetData, $request);

            return ApiResponseHelper::apiSuccess(201, 'Oferta almacenada correctamente.');

        } catch (ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al crear la oferta', $e->getMessage(), 500, 'CREATE_OFFER_ERROR');
        }
    }

    /**
     * Procesar solicitud de valuación
     */
    public function valuation(StoreValuationRequest $request)
    {
        try {
            $data = $request->validated();

            // Construir comentarios con información adicional
            $comments = [];
            if (!empty($data['city'])) {
                $comments[] = "Ciudad/Sucursal: " . $data['city'];
            }
            if (!empty($data['preferredDate'])) {
                $comments[] = "Fecha preferida: " . $data['preferredDate'];
            }
            if (!empty($data['preferredTime'])) {
                $comments[] = "Hora preferida: " . $data['preferredTime'];
            }
            $fullComments = implode(" | ", $comments);

            // Preparar datos para enviar a Google Sheets
            $googleSheetData = [
                'sucursal' => '', // A: Sucursal (vacío por defecto, ajustar si es necesario)
                'formType' => 'valuation',
                'fecha' => now()->format('Y-m-d H:i:s'),
                'canal' => 'abcars.mx',
                'nombre' => $data['fullName'],
                'apellido' => $data['lastName'] ?? '',
                'telefono' => $data['phone'],
                'correo' => $data['email'],
                'marca' => $data['brand'],
                'modelo' => $data['model'],
                'año' => $data['year'],
                'kilometraje' => $data['mileage'],
                'comentarios' => $fullComments,
                'referido_por' => $data['referrer_uuid'] ?? '',
            ];

            $webhookUrl = GoogleSheetHelper::getWebhookUrl('GOOGLE_SHEET_WEBHOOK_PRICE_OFFER');
            
            // Enviar al webhook de forma asíncrona para no bloquear la respuesta
            if ($webhookUrl) {
                dispatch(function () use ($webhookUrl, $googleSheetData) {
                    try {
                        $result = GoogleSheetHelper::sendToGoogleSheet($webhookUrl, $googleSheetData);
                        Log::info('Valuation form sent to Google Sheets', [
                            'url' => $webhookUrl,
                            'success' => $result,
                            'data' => $googleSheetData
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Error sending valuation form to Google Sheets', [
                            'url' => $webhookUrl,
                            'error' => $e->getMessage(),
                            'data' => $googleSheetData
                        ]);
                    }
                })->afterResponse();
            } else {
                Log::warning('GOOGLE_SHEET_WEBHOOK_PRICE_OFFER not configured');
            }

            $this->trackFormSubmission('valuation', $googleSheetData, $request);

            return ApiResponseHelper::apiSuccess(201, 'Solicitud de valuación almacenada correctamente.');

        } catch (ValidationException $e) {
            return ApiResponseHelper::validationError($e);
        } catch (\Exception $e) {
            return ApiResponseHelper::apiError('Error al crear la solicitud de valuación', $e->getMessage(), 500, 'CREATE_VALUATION_ERROR');
        }
    }
}
