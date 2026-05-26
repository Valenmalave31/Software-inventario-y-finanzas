import { Injectable } from '@nestjs/common';
import sgMail from '@sendgrid/mail';

@Injectable()
export class MailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }

  async sendPasswordReset(correo: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'https://betty-s.vercel.app';
    const resetUrl = `${frontendUrl}/change-password?token=${token}`; 

    const msg = {
      to: correo,
      from: process.env.SENDGRID_FROM!,
      templateId: process.env.SENDGRID_TEMPLATE_ID!,
      dynamic_template_data: {
        nombre: correo,      
        reset_link: resetUrl, 
      },
    };

    try {
      await sgMail.send(msg);
    } catch (error: any) {
      const responseBody = error?.response?.body ?? error;

      console.error('ERROR SENDGRID DETALLADO:', JSON.stringify(responseBody, null, 2));
      throw error;
    }

    return { mensaje: 'Correo de recuperación enviado con template dinámico' };
  }

  async sendAlertEmail(
    correo: string,
    data: {
      nombre: string;
      tipo_alerta: string;
      fecha: string;
      hora: string;
      detalle: string;
      detalle_link: string;
    },
  ) {
    const msg = {
      to: correo,
      from: process.env.SENDGRID_FROM!,
      templateId: process.env.SENDGRID_ALERT_TEMPLATE_ID!,
      dynamic_template_data: {
        nombre: data.nombre,
        tipo_alerta: data.tipo_alerta,
        fecha: data.fecha,
        hora: data.hora,
        detalle: data.detalle,
        detalle_link: data.detalle_link,
      },
    };

    await sgMail.send(msg);
    return { mensaje: 'Correo de alerta enviado exitosamente' };
  }

  async sendAlertEmailToAll(
    usuarios: Array<{ nombre: string; correo: string }>,
    data: {
      tipo_alerta: string;
      fecha: string;
      hora: string;
      detalle: string;
      detalle_link: string;
    },
  ) {
    const promises = usuarios.map((usuario) =>
      this.sendAlertEmail(usuario.correo, {
        nombre: usuario.nombre,
        tipo_alerta: data.tipo_alerta,
        fecha: data.fecha,
        hora: data.hora,
        detalle: data.detalle,
        detalle_link: data.detalle_link,
      }),
    );

    await Promise.all(promises);
    return { mensaje: `Alerta enviada a ${usuarios.length} usuarios` };
  }
}

