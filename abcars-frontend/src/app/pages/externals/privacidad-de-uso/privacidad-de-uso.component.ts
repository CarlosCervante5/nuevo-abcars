import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ModernFooterComponent } from '../../../shared/components/modern-footer/modern-footer.component';
import { DarkNavComponent } from "@components/dark-nav/dark-nav.component";

@Component({
  selector: 'app-privacidad-de-uso',
  standalone: true,
  imports: [CommonModule, RouterModule, ModernFooterComponent, DarkNavComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navbar -->
      <app-dark-nav></app-dark-nav>
      <!-- Contenido principal -->
      <div class="container mx-auto px-4 py-16" style="margin-top: 70px;">
        <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-6">Aviso de Privacidad</h1>

          <p class="text-gray-700 mb-6 leading-relaxed">
            (Vigente a partir del 6 de julio de 2011)
          </p>

          <p class="text-gray-700 mb-6 leading-relaxed">
            En Automotriz Balderrama Puebla S.A. de C.V., con domicilio en Blvd. Hermanos Serdán N. 241 Col. Aquiles Serdán, C.P. 72140, Puebla, Pue, 
            la información de nuestros clientes y clientes potenciales es tratada de forma estrictamente confidencial y es tan importante como su seguridad 
            al conducir nuestros vehículos, por lo que hacemos un esfuerzo permanente para salvaguardarla.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">FINALIDADES Y TRANSMISIÓN DE LOS DATOS PERSONALES</h2>

          <p class="text-gray-700 mb-6 leading-relaxed">
            Más que una política, en Automotriz Balderrama puebla S.A. de C.V. tenemos la filosofía de mantener una relación estrecha y activa 
            con nuestros clientes y clientes potenciales. Al proporcionar sus datos personales 
            (tales como: nombre, domicilio, correo electrónico, teléfono y otros datos de contacto), consiente su tratamiento tanto dentro como 
            fuera de los Estados Unidos Mexicanos y entiende que podrán ser tratados directa o indirectamente por el Distribuidor, 
            General Motors de México S. de R.L. de C.V. (GMM) y/o sus terceros proveedores de servicios con quienes tiene una relación jurídica, 
            así como en su caso autoridades competentes, con las siguientes finalidades: 
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Para el caso de clientes:</h2>
          <p class="text-gray-700 mb-6 leading-relaxed">
            Proveerle un bien y/o servicio.
          </p>
          <p class="text-gray-700 mb-6 leading-relaxed">
            Realizar actividades de mercadeo y promoción en general.
          </p>
          <p class="text-gray-700 mb-6 leading-relaxed">
            Ofrecerle nuestros productos, servicios e información de nuestros socios de negocios. Análisis estadísticos y de mercado.
          </p>

          <p class="text-gray-700 mb-6 leading-relaxed"> 
            Mantener actualizados nuestros registros para poder responder a sus consultas, invitarle a eventos, hacer válida la garantía 
            de su vehículo, informarle acerca de llamados a revisión de su vehículo, hacer de su conocimiento nuestras promociones y lanzamientos
            y mantener comunicación en general, así como, dar seguimiento a nuestra relación comercial.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Para el caso de clientes potenciales:</h2>

          <p class="text-gray-700 mb-4 leading-relaxed">
            Realizar actividades de mercadeo y promoción en general.
          </p>
          <p class="text-gray-700 mb-4 leading-relaxed">
            Ofrecerle nuestros productos, servicios e información de nuestros socios de negocio. Análisis estadísticos y de mercado.
          </p>
          <p class="text-gray-700 mb-4 leading-relaxed">
            Mantener actualizados nuestros registros para poder responder a sus consultas, invitarle a eventos, 
            hacer de su conocimiento nuestras promociones y lanzamientos así como mantener comunicación en general.
          </p>
          <p class="text-gray-700 mb-4 leading-relaxed">
            Cualquier otro fin análogo relacionado con el objeto social de la Automotriz.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">SOLICITUD DE ACCESO, RECTIFICACIÓN, CANCELACIÓN U OPOSICIÓN DE DATOS PERSONALES Y REVOCACIÓN DEL CONSENTIMIENTO (SOLICITUD ARCO)</h2>

          <p class="text-gray-700 mb-4 leading-relaxed">
            Todos sus datos personales son tratados de acuerdo a la legislación aplicable y vigente en el país, por ello le informamos que usted 
            tiene en todo momento el derecho de acceder, rectificar, cancelar u oponerse al tratamiento que le damos a sus datos personales, así 
            como revocar el consentimiento otorgado para el tratamiento de los mismos y dejar de recibir mensajes promocionales, derecho que podrá 
            hacer valer a través del Centro de Atención a Automotriz Balderrama Puebla, S.A. de C.V. la siguiente dirección electrónica: 
            datospersonales&#64;chevroletbalderrama.com
          </p>
          
          <p class="text-gray-700 mb-4 leading-relaxed">
            A través de este canal usted podrá actualizar sus datos y especificar el medio por el cual desea recibir información, ya que en caso 
            de no contar con esta especificación de su parte, el Distribuidor establecerá el canal que considere pertinente para enviarle 
            información. 
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">MODIFICACIONES AL AVISO DE PRIVACIDAD</h2>

          <p class="text-gray-700 mb-4 leading-relaxed">
            Este aviso de privacidad podrá ser modificado de tiempo en tiempo por el Distribuidor, dichas modificaciones serán oportunamente 
            informadas a través de nuestra página en internet www.chevroletbalderrama.com.mx
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
export class PrivacidadDeUsoComponent {
}

