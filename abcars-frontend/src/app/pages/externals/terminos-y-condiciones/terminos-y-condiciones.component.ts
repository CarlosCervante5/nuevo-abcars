import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ModernFooterComponent } from '../../../shared/components/modern-footer/modern-footer.component';
import { DarkNavComponent } from "@components/dark-nav/dark-nav.component";

@Component({
  selector: 'app-terminos-y-condiciones',
  standalone: true,
  imports: [CommonModule, RouterModule, ModernFooterComponent, DarkNavComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navbar -->
      <app-dark-nav></app-dark-nav>
      <!-- Contenido principal -->
      <div class="container mx-auto px-4 py-16" style="margin-top: 70px;">
        <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-6">Términos y Condiciones de Uso</h1>

          <p class="text-gray-700 mb-6 leading-relaxed">
            (Vigente a partir del 6 de julio de 2011)
          </p>

          <p class="text-gray-700 mb-6 leading-relaxed">
            Los presentes términos y condiciones de uso establecen las reglas y regulaciones para el uso del sitio web 
            y los servicios ofrecidos por Automotriz Balderrama Puebla S.A. de C.V., con domicilio en Blvd. Hermanos Serdán 
            N. 241 Col. Aquiles Serdán, C.P. 72140, Puebla, Pue. Al acceder y utilizar este sitio web, usted acepta 
            cumplir con estos términos y condiciones en su totalidad. Si no está de acuerdo con alguna parte de estos 
            términos, no debe utilizar nuestro sitio web ni nuestros servicios.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">1. ACEPTACIÓN DE LOS TÉRMINOS</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            Al acceder, navegar y utilizar este sitio web, así como cualquiera de los servicios ofrecidos a través del mismo, 
            usted reconoce que ha leído, entendido y acepta estar sujeto a estos términos y condiciones de uso, así como a 
            todas las leyes y regulaciones aplicables. Si no acepta estos términos, debe abstenerse de utilizar el sitio web 
            y los servicios ofrecidos. El uso continuado del sitio web después de cualquier modificación a estos términos 
            constituirá su aceptación de dichas modificaciones.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">2. USO DEL SITIO WEB</h2>

          <p class="text-gray-700 mb-4 leading-relaxed">
            El uso de este sitio web está sujeto a las siguientes condiciones y restricciones:
          </p>

          <ul class="list-disc list-inside text-gray-700 mb-6 space-y-2 ml-4">
            <li>Usted debe ser mayor de edad (18 años o más) para utilizar nuestros servicios y realizar transacciones a través de este sitio web.</li>
            <li>La información proporcionada debe ser veraz, precisa, actualizada y completa en todo momento.</li>
            <li>No está permitido el uso del sitio para fines ilegales, fraudulentos o no autorizados.</li>
            <li>No debe intentar acceder a áreas restringidas del sitio web o interferir con su funcionamiento.</li>
            <li>No está permitido transmitir virus, malware o cualquier código malicioso a través del sitio web.</li>
            <li>No debe utilizar el sitio web de manera que pueda dañar, deshabilitar, sobrecargar o comprometer nuestros servidores o redes.</li>
            <li>El contenido del sitio está protegido por derechos de autor y otras leyes de propiedad intelectual.</li>
            <li>Usted es responsable de mantener la confidencialidad de su información de cuenta y contraseña, si aplica.</li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">3. SERVICIOS OFRECIDOS</h2>

          <p class="text-gray-700 mb-4 leading-relaxed">
            Automotriz Balderrama Puebla S.A. de C.V. ofrece a través de este sitio web los siguientes servicios:
          </p>

          <ul class="list-disc list-inside text-gray-700 mb-6 space-y-2 ml-4">
            <li>Consulta y visualización de inventario de vehículos nuevos y usados</li>
            <li>Solicitud de información sobre vehículos disponibles</li>
            <li>Solicitud de cotizaciones de financiamiento automotriz</li>
            <li>Información sobre seguros automotrices</li>
            <li>Agendamiento de citas para servicio técnico y mantenimiento</li>
            <li>Consulta de refacciones y partes originales</li>
            <li>Solicitud de valuación de vehículos</li>
            <li>Información sobre promociones y eventos especiales</li>
            <li>Contacto con nuestro equipo de ventas y servicio al cliente</li>
          </ul>

          <p class="text-gray-700 mb-6 leading-relaxed">
            La disponibilidad de estos servicios puede estar sujeta a cambios sin previo aviso. Nos reservamos el derecho 
            de modificar, suspender o discontinuar cualquier servicio en cualquier momento.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">4. INFORMACIÓN DE PRODUCTOS Y PRECIOS</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            Toda la información sobre vehículos, precios, especificaciones, características y disponibilidad mostrada en 
            este sitio web se proporciona únicamente con fines informativos y está sujeta a cambios sin previo aviso. 
            Los precios mostrados pueden no incluir impuestos, tarifas de registro, costos de financiamiento u otros cargos 
            adicionales. Los precios finales y las condiciones de venta serán confirmados al momento de la transacción 
            y están sujetos a verificación de disponibilidad del vehículo.
          </p>

          <p class="text-gray-700 mb-6 leading-relaxed">
            Las imágenes de los vehículos son solo ilustrativas y pueden no reflejar exactamente el vehículo disponible. 
            Las especificaciones, características y equipamiento pueden variar. Se recomienda verificar directamente con 
            nuestro equipo de ventas la información exacta del vehículo de su interés antes de realizar cualquier compromiso.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">5. RESERVAS Y CITAS</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            Las solicitudes de reserva de vehículos o agendamiento de citas realizadas a través de este sitio web son 
            solicitudes preliminares y no constituyen una garantía de disponibilidad. Todas las reservas y citas están 
            sujetas a confirmación por parte de Automotriz Balderrama Puebla S.A. de C.V. Nos reservamos el derecho de 
            cancelar o modificar cualquier reserva o cita si el vehículo o servicio no está disponible o por cualquier 
            otra razón justificada.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">6. FINANCIAMIENTO Y SEGUROS</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            Las solicitudes de financiamiento y seguros realizadas a través de este sitio web están sujetas a aprobación 
            por parte de las instituciones financieras y aseguradoras correspondientes. Automotriz Balderrama Puebla S.A. 
            de C.V. actúa como intermediario y no garantiza la aprobación de ninguna solicitud de financiamiento o seguro. 
            Las tasas de interés, términos, condiciones y primas están sujetos a la evaluación crediticia y otros factores 
            determinados por las instituciones correspondientes.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">7. PROPIEDAD INTELECTUAL</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            Todo el contenido de este sitio web, incluyendo pero no limitado a textos, gráficos, logotipos, iconos, imágenes, 
            fotografías, videos, audio, software, código fuente, diseño, estructura y disposición, es propiedad de 
            Automotriz Balderrama Puebla S.A. de C.V., sus proveedores de contenido, o terceros que han otorgado licencia 
            para su uso, y está protegido por las leyes de derechos de autor, marcas registradas y otras leyes de propiedad 
            intelectual de México y tratados internacionales.
          </p>

          <p class="text-gray-700 mb-6 leading-relaxed">
            Está prohibida la reproducción, distribución, modificación, transmisión, reutilización, reenvío o uso de cualquier 
            contenido de este sitio web para fines comerciales o públicos sin el consentimiento previo y por escrito de 
            Automotriz Balderrama Puebla S.A. de C.V. El uso no autorizado de cualquier material protegido por derechos de 
            autor puede constituir una violación de las leyes de derechos de autor, marcas registradas u otras leyes aplicables.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">8. ENLACES A SITIOS DE TERCEROS</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            Este sitio web puede contener enlaces a sitios web de terceros que no están bajo el control de Automotriz Balderrama 
            Puebla S.A. de C.V. No tenemos responsabilidad sobre el contenido, políticas de privacidad, términos de uso o prácticas 
            de cualquier sitio web de terceros. La inclusión de cualquier enlace no implica respaldo por nuestra parte. 
            Usted accede a estos sitios bajo su propio riesgo y debe revisar los términos y condiciones y políticas de privacidad 
            de dichos sitios.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">9. PROTECCIÓN DE DATOS PERSONALES</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            El tratamiento de sus datos personales se rige por nuestro Aviso de Privacidad, el cual forma parte integral de 
            estos términos y condiciones. Al utilizar este sitio web y proporcionar información personal, usted consiente el 
            tratamiento de sus datos personales de acuerdo con nuestro Aviso de Privacidad. Le recomendamos revisar nuestro 
            Aviso de Privacidad para entender cómo recopilamos, utilizamos, protegemos y compartimos su información personal.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">10. LIMITACIÓN DE RESPONSABILIDAD</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            En la máxima medida permitida por la ley aplicable, Automotriz Balderrama Puebla S.A. de C.V., sus directores, 
            empleados, agentes, proveedores y afiliados no serán responsables de ningún daño directo, indirecto, incidental, 
            especial, consecuente o punitivo que resulte del uso o la imposibilidad de usar este sitio web, incluyendo pero 
            no limitado a:
          </p>

          <ul class="list-disc list-inside text-gray-700 mb-6 space-y-2 ml-4">
            <li>Pérdida de datos, información o beneficios</li>
            <li>Interrupción del negocio</li>
            <li>Errores u omisiones en el contenido del sitio web</li>
            <li>Virus u otros componentes dañinos</li>
            <li>Problemas técnicos o fallas en el sistema</li>
            <li>Acciones de terceros</li>
            <li>Decisiones tomadas basándose en información del sitio web</li>
          </ul>

          <p class="text-gray-700 mb-6 leading-relaxed">
            Esta limitación de responsabilidad se aplica independientemente de la teoría legal en la que se base la reclamación, 
            ya sea contrato, agravio, negligencia, responsabilidad estricta u otra, incluso si se nos ha advertido de la 
            posibilidad de tales daños.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">11. EXENCIÓN DE GARANTÍAS</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            Este sitio web y todo su contenido se proporcionan "tal cual" y "según disponibilidad" sin garantías de ningún tipo, 
            ya sean expresas o implícitas, incluyendo pero no limitado a garantías de comerciabilidad, idoneidad para un propósito 
            particular, no infracción, seguridad, precisión, integridad o disponibilidad continua. No garantizamos que el sitio 
            web esté libre de errores, virus u otros componentes dañinos, o que los defectos serán corregidos.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">12. INDEMNIZACIÓN</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            Usted acepta indemnizar, defender y eximir de responsabilidad a Automotriz Balderrama Puebla S.A. de C.V., sus 
            directores, empleados, agentes, proveedores y afiliados de y contra todas y cada una de las reclamaciones, demandas, 
            responsabilidades, daños, pérdidas, costos y gastos (incluyendo honorarios razonables de abogados) que surjan de o 
            estén relacionados con:
          </p>

          <ul class="list-disc list-inside text-gray-700 mb-6 space-y-2 ml-4">
            <li>Su uso o mal uso del sitio web</li>
            <li>Su violación de estos términos y condiciones</li>
            <li>Su violación de cualquier derecho de terceros, incluyendo derechos de propiedad intelectual</li>
            <li>Cualquier contenido o información que usted proporcione a través del sitio web</li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">13. MODIFICACIONES DE LOS TÉRMINOS</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            Automotriz Balderrama Puebla S.A. de C.V. se reserva el derecho de modificar, actualizar o cambiar estos términos 
            y condiciones en cualquier momento y a su sola discreción, sin previo aviso. Los cambios entrarán en vigor 
            inmediatamente después de su publicación en el sitio web. Es su responsabilidad revisar periódicamente estos términos 
            y condiciones para estar al tanto de cualquier cambio. El uso continuado del sitio web después de la publicación de 
            cambios constituye su aceptación de dichos cambios.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">14. TERMINACIÓN</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            Nos reservamos el derecho, a nuestra sola discreción, de terminar o suspender su acceso al sitio web y a los servicios 
            ofrecidos, con o sin causa y con o sin previo aviso, por cualquier motivo, incluyendo pero no limitado a la violación 
            de estos términos y condiciones. En caso de terminación, su derecho a utilizar el sitio web cesará inmediatamente.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">15. LEY APLICABLE Y JURISDICCIÓN</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            Estos términos y condiciones se rigen e interpretan de acuerdo con las leyes de los Estados Unidos Mexicanos, 
            específicamente las leyes del Estado de Puebla. Cualquier disputa que surja de o esté relacionada con estos términos 
            y condiciones o el uso de este sitio web estará sujeta a la jurisdicción exclusiva de los tribunales competentes 
            de la ciudad de Puebla, Puebla, México, renunciando expresamente las partes a cualquier otro fuero que pudiera 
            corresponderles.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">16. SEPARABILIDAD</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            Si alguna disposición de estos términos y condiciones se determina que es inválida, ilegal o inaplicable por un 
            tribunal competente, dicha disposición será modificada e interpretada para lograr los objetivos de dicha disposición 
            en la máxima medida posible bajo la ley aplicable, y las disposiciones restantes permanecerán en pleno vigor y efecto.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">17. RENUNCIA</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            El hecho de que Automotriz Balderrama Puebla S.A. de C.V. no ejerza o haga valer cualquier derecho o disposición 
            de estos términos y condiciones no constituirá una renuncia a tal derecho o disposición. Cualquier renuncia a cualquier 
            término o condición debe ser explícita y por escrito.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">18. ACUERDO COMPLETO</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            Estos términos y condiciones, junto con nuestro Aviso de Privacidad y cualquier otro acuerdo legal que pueda existir 
            entre usted y Automotriz Balderrama Puebla S.A. de C.V., constituyen el acuerdo completo entre las partes con respecto 
            al uso del sitio web y reemplazan todos los acuerdos, entendimientos o comunicaciones previos, ya sean escritos u orales, 
            relacionados con el mismo tema.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">19. CONTACTO</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            Si tiene alguna pregunta, comentario o inquietud sobre estos términos y condiciones, puede contactarnos a través de 
            los siguientes medios:
          </p>

          <p class="text-gray-700 mb-4 leading-relaxed">
            <strong>Automotriz Balderrama Puebla S.A. de C.V.</strong><br>
            Blvd. Hermanos Serdán N. 241<br>
            Col. Aquiles Serdán, C.P. 72140<br>
            Puebla, Pue., México
          </p>

          <p class="text-gray-700 mb-6 leading-relaxed">
            Correo electrónico: contacto&#64;abcars.mx<br>
            Para asuntos relacionados con datos personales: datospersonales&#64;chevroletbalderrama.com
          </p>

          <p class="text-gray-700 mb-6 leading-relaxed">
            <strong>Última actualización: 6 de julio de 2011</strong>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <app-modern-footer></app-modern-footer>
    </div>
  `,
  styles: [`
    /* Estilos adicionales si son necesarios */
  `]
})
export class TerminosYCondicionesComponent implements OnInit {
  ngOnInit(): void {
    // Scroll to top on component load
    window.scrollTo(0, 0);
  }
}

