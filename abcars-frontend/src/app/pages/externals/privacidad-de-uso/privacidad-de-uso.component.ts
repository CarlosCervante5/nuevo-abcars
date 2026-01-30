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
          <h1 class="text-4xl font-bold text-gray-900 mb-2">AVISO DE PRIVACIDAD</h1>
          <p class="text-gray-700 mb-6 leading-relaxed">
            Sitio web y aplicación móvil ABCars
            <br />
            Vigente a partir del 6 de julio de 2011
          </p>

          <p class="text-gray-700 mb-6 leading-relaxed">
            En Automotriz Balderrama Puebla, S.A. de C.V., con domicilio en Blvd. Hermanos Serdán No. 241, Col. Aquiles Serdán,
            C.P. 72140, Puebla, Puebla, la información de nuestros clientes y clientes potenciales es tratada de forma estrictamente
            confidencial y es tan importante como su seguridad al conducir nuestros vehículos, por lo que hacemos un esfuerzo permanente
            para salvaguardarla.
          </p>

          <p class="text-gray-700 mb-6 leading-relaxed">
            Este Aviso de Privacidad describe de manera clara cómo se recopila, utiliza, almacena y protege la información a través del sitio
            web y la aplicación móvil ABCars, en cumplimiento con la legislación aplicable y las políticas de Google Play y App Store.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">FINALIDADES Y TRANSMISIÓN DE LOS DATOS PERSONALES</h2>
          <p class="text-gray-700 mb-6 leading-relaxed">
            Más que una política, en Automotriz Balderrama Puebla S.A. de C.V. tenemos la filosofía de mantener una relación estrecha y activa
            con nuestros clientes y clientes potenciales. Al proporcionar sus datos personales (tales como: nombre, domicilio, correo electrónico,
            teléfono y otros datos de contacto), consiente su tratamiento tanto dentro como fuera de los Estados Unidos Mexicanos y entiende que
            podrán ser tratados directa o indirectamente por el Distribuidor, General Motors de México S. de R.L. de C.V. (GMM) y/o sus terceros
            proveedores de servicios con quienes tiene una relación jurídica, así como en su caso autoridades competentes, con las siguientes finalidades:
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Para el caso de clientes:</h2>
          <ul class="text-gray-700 mb-6 leading-relaxed list-disc pl-6 space-y-2">
            <li>Proveerle un bien y/o servicio.</li>
            <li>Realizar actividades de mercadeo y promoción en general.</li>
            <li>Ofrecerle nuestros productos, servicios e información de nuestros socios de negocios. Análisis estadísticos y de mercado.</li>
            <li>
              Mantener actualizados nuestros registros para poder responder a sus consultas, invitarle a eventos, hacer válida la garantía de su
              vehículo, informarle acerca de llamados a revisión de su vehículo, hacer de su conocimiento nuestras promociones y lanzamientos y mantener
              comunicación en general, así como, dar seguimiento a nuestra relación comercial.
            </li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Para el caso de clientes potenciales:</h2>
          <ul class="text-gray-700 mb-6 leading-relaxed list-disc pl-6 space-y-2">
            <li>Realizar actividades de mercadeo y promoción en general.</li>
            <li>Ofrecerle nuestros productos, servicios e información de nuestros socios de negocio. Análisis estadísticos y de mercado.</li>
            <li>
              Mantener actualizados nuestros registros para poder responder a sus consultas, invitarle a eventos, hacer de su conocimiento nuestras
              promociones y lanzamientos así como mantener comunicación en general.
            </li>
            <li>Cualquier otro fin análogo relacionado con el objeto social de la Automotriz.</li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">DATOS PERSONALES QUE RECOPILA LA APLICACIÓN</h2>
          <p class="text-gray-700 mb-4 leading-relaxed">
            La aplicación móvil ABCars recopila únicamente la información necesaria para ofrecer sus funcionalidades, incluyendo:
          </p>
          <ul class="text-gray-700 mb-6 leading-relaxed list-disc pl-6 space-y-2">
            <li>Datos de identificación y contacto proporcionados voluntariamente por el usuario (nombre, correo electrónico, teléfono).</li>
            <li>Fotografías de vehículos, capturadas por el usuario mediante la cámara del dispositivo o seleccionadas desde la galería.</li>
            <li>Información relacionada con el vehículo para fines de análisis y valuación.</li>
          </ul>
          <p class="text-gray-700 mb-6 leading-relaxed">
            La aplicación no recopila datos en segundo plano ni accede a información distinta a la autorizada expresamente por el usuario.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">PERMISOS DEL DISPOSITIVO</h2>
          <p class="text-gray-700 mb-4 leading-relaxed">
            La aplicación podrá solicitar los siguientes permisos, conforme a las políticas de Google Play y App Store:
          </p>
          <ul class="text-gray-700 mb-6 leading-relaxed list-disc pl-6 space-y-2">
            <li>Cámara: para tomar fotografías del vehículo.</li>
            <li>Galería/Almacenamiento: para seleccionar imágenes del vehículo.</li>
          </ul>
          <p class="text-gray-700 mb-6 leading-relaxed">
            Estos permisos se utilizan exclusivamente para la funcionalidad de valuación de vehículos y pueden ser revocados en cualquier momento desde la
            configuración del dispositivo.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">USO DE LOS DATOS PERSONALES</h2>
          <p class="text-gray-700 mb-4 leading-relaxed">
            Los datos personales recopilados se utilizan para las siguientes finalidades:
          </p>
          <p class="text-gray-900 font-semibold mb-2">Finalidades primarias (necesarias para el servicio):</p>
          <ul class="text-gray-700 mb-6 leading-relaxed list-disc pl-6 space-y-2">
            <li>Valuación de vehículos con base en las fotografías e información proporcionadas.</li>
            <li>Proveer los servicios disponibles dentro de la aplicación.</li>
            <li>Atender solicitudes, consultas o seguimiento relacionados con el uso de la app.</li>
          </ul>
          <p class="text-gray-900 font-semibold mb-2">Finalidades secundarias:</p>
          <ul class="text-gray-700 mb-6 leading-relaxed list-disc pl-6 space-y-2">
            <li>Actividades de mercadotecnia y promoción.</li>
            <li>Envío de información sobre productos, servicios, promociones y eventos de ABCars.</li>
            <li>Análisis estadísticos y de mercado.</li>
          </ul>
          <p class="text-gray-700 mb-6 leading-relaxed">
            El usuario puede oponerse o revocar el uso de sus datos para finalidades secundarias sin afectar el funcionamiento principal de la aplicación.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">ALMACENAMIENTO, SEGURIDAD Y CONSERVACIÓN DE LOS DATOS</h2>
          <ul class="text-gray-700 mb-6 leading-relaxed list-disc pl-6 space-y-2">
            <li>Las fotografías de los vehículos y demás datos personales se almacenan de forma segura en los servidores de ABCars.</li>
            <li>ABCars implementa medidas de seguridad administrativas, técnicas y físicas para proteger la información.</li>
            <li>Los datos se conservarán únicamente durante el tiempo necesario para cumplir con las finalidades descritas o conforme a obligaciones legales.</li>
            <li>Una vez cumplida su finalidad, los datos serán eliminados o anonimizados.</li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">TRANSFERENCIA DE DATOS</h2>
          <p class="text-gray-700 mb-4 leading-relaxed">
            Los datos personales podrán ser compartidos únicamente con:
          </p>
          <ul class="text-gray-700 mb-6 leading-relaxed list-disc pl-6 space-y-2">
            <li>Proveedores de servicios tecnológicos que apoyen la operación de la app.</li>
            <li>Autoridades competentes, cuando sea legalmente requerido.</li>
          </ul>
          <p class="text-gray-700 mb-6 leading-relaxed">
            En ningún caso los datos serán vendidos ni utilizados para fines distintos a los descritos en este aviso.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">SOLICITUD DE ACCESO, RECTIFICACIÓN, CANCELACIÓN U OPOSICIÓN DE DATOS PERSONALES Y REVOCACIÓN DEL CONSENTIMIENTO (SOLICITUD ARCO)</h2>
          <p class="text-gray-700 mb-4 leading-relaxed">
            Todos sus datos personales son tratados de acuerdo a la legislación aplicable y vigente en el país, por ello le informamos que usted tiene en
            todo momento el derecho de acceder, rectificar, cancelar u oponerse al tratamiento que le damos a sus datos personales, así como revocar el
            consentimiento otorgado para el tratamiento de los mismos y dejar de recibir mensajes promocionales.
          </p>
          <p class="text-gray-700 mb-4 leading-relaxed">
            El usuario también puede solicitar la eliminación de sus datos personales y fotografías, revocar el consentimiento para el tratamiento de datos
            o dejar de recibir comunicaciones promocionales.
          </p>
          <p class="text-gray-700 mb-4 leading-relaxed">
            Las solicitudes deberán enviarse al contacto de privacidad: datospersonales&#64;chevroletbalderrama.com
          </p>
          <p class="text-gray-700 mb-6 leading-relaxed">
            A través de este canal usted podrá actualizar sus datos y especificar el medio por el cual desea recibir información, ya que en caso de no
            contar con esta especificación de su parte, el Distribuidor establecerá el canal que considere pertinente para enviarle información.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">MODIFICACIONES AL AVISO DE PRIVACIDAD</h2>
          <p class="text-gray-700 mb-4 leading-relaxed">
            Este aviso de privacidad podrá ser modificado de tiempo en tiempo por el Distribuidor, dichas modificaciones serán oportunamente informadas a
            través de nuestra página en internet www.chevroletbalderrama.com.mx
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

