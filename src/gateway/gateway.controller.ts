import {
  Controller, Post, Get, Delete, Patch,
  Param, Query, Body, Req, Res, HttpStatus
} from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { Request, Response } from 'express';
import axios from 'axios';

interface AuthValidationResponse {
  valid: boolean;
  correo: string;
}

@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  // ==== AUTH ====

  @Post('/auth/registro')
  async registro(@Body() body: any, @Res() res: Response) {
    return this.gatewayService.forwardPost('http://autenticacion:8081/auth/registro', body, res);
  }

  @Post('/auth/registro/admin')
  async registroAdmin(@Body() body: any, @Res() res: Response) {
    return this.gatewayService.forwardPost('http://autenticacion:8081/auth/registro/admin', body, res);
  }

  @Post('/auth/login')
  async login(@Body() body: any, @Res() res: Response) {
    return this.gatewayService.forwardPost('http://autenticacion:8081/auth/login', body, res);
  }

  @Get('/auth/validate')
  async validate(@Req() req: Request, @Res() res: Response) {
    const token = req.headers['authorization'];
    if (typeof token !== 'string') {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Falta el token de autorización' });
    }
    return this.gatewayService.forwardGet('http://autenticacion:8081/auth/validate', token, res);
  }

  // ==== DOCUMENTOS ====

  @Post('/documentos')
  async crearDocumento(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    const token = req.headers['authorization'];
    if (typeof token !== 'string') {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Token no proporcionado' });
    }

    try {
      const { data } = await axios.get<AuthValidationResponse>(
        'http://autenticacion:8081/auth/validate',
        { headers: { Authorization: token } }
      );

      if (!data.valid || !data.correo) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Token inválido' });
      }

      return this.gatewayService.forwardPostWithHeader(
        'http://microservicio-documentos:8082/documentos',
        body,
        { 'X-Autor-Correo': data.correo },
        res
      );
    } catch {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Error validando el token' });
    }
  }

  @Get('/documentos')
  async obtenerPorAutor(@Query('correo') correo: string, @Res() res: Response, @Req() req: Request) {
    const token = req.headers['authorization'];
    if (!correo) return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Falta el parámetro correo' });
    if (typeof token !== 'string') return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Token no proporcionado' });

    return this.gatewayService.forwardGet(
      `http://microservicio-documentos:8082/documentos?correo=${correo}`, token, res
    );
  }

  @Get('/documentos/:id')
  async obtenerPorId(@Param('id') id: string, @Res() res: Response, @Req() req: Request) {
    const token = req.headers['authorization'];
    if (typeof token !== 'string') return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Token no proporcionado' });

    return this.gatewayService.forwardGet(
      `http://microservicio-documentos:8082/documentos/${id}`, token, res
    );
  }

  @Delete('/documentos/:id')
  async eliminarDocumento(@Param('id') id: string, @Res() res: Response, @Req() req: Request) {
    const token = req.headers['authorization'];
    if (typeof token !== 'string') return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Token no proporcionado' });

    try {
      const { data } = await axios.get<AuthValidationResponse>(
        'http://autenticacion:8081/auth/validate',
        { headers: { Authorization: token } }
      );

      if (!data.valid) return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Token inválido' });

      return this.gatewayService.forwardDelete(
        `http://microservicio-documentos:8082/documentos/${id}`, token, res
      );
    } catch {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Error validando el token' });
    }
  }

  @Patch('/documentos/:id')
  async editarDocumento(@Param('id') id: string, @Body() body: any, @Req() req: Request, @Res() res: Response) {
    const token = req.headers['authorization'];
    if (typeof token !== 'string') return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Token no proporcionado' });

    try {
      const { data } = await axios.get<AuthValidationResponse>(
        'http://autenticacion:8081/auth/validate',
        { headers: { Authorization: token } }
      );

      if (!data.valid || !data.correo) return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Token inválido' });

      return this.gatewayService.forwardPatchWithHeader(
        `http://microservicio-documentos:8082/documentos/${id}`,
        body,
        { 'X-Correo-Invitado': data.correo },
        res
      );
    } catch {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Error validando el token' });
    }
  }

  @Post('/documentos/:id/invitar')
  async invitarUsuario(@Param('id') id: string, @Query('correoInvitado') correoInvitado: string, @Query('rol') rol: string, @Req() req: Request, @Res() res: Response) {
    const token = req.headers['authorization'];
    if (typeof token !== 'string') return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Token no proporcionado' });

    const url = `http://microservicio-documentos:8082/documentos/${id}/invitar?correoInvitado=${correoInvitado}&rol=${rol}`;
    return this.gatewayService.forwardPostWithTokenAndQuery(url, token, res);
  }

  @Post('/documentos/:id/aceptar')
  async aceptarInvitacion(@Param('id') id: string, @Query('correoInvitado') correoInvitado: string, @Req() req: Request, @Res() res: Response) {
    const token = req.headers['authorization'];
    if (typeof token !== 'string') return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Token no proporcionado' });

    const url = `http://microservicio-documentos:8082/documentos/${id}/aceptar?correoInvitado=${correoInvitado}`;
    return this.gatewayService.forwardPostWithTokenAndQuery(url, token, res);
  }

  @Get('/documentos/:id/invitaciones')
  async verInvitaciones(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const token = req.headers['authorization'];
    if (typeof token !== 'string') return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Token no proporcionado' });

    const url = `http://microservicio-documentos:8082/documentos/${id}/invitaciones`;
    return this.gatewayService.forwardGet(url, token, res);
  }

  @Get('/documentos/compartidos')
  async documentosCompartidos(@Query('correoInvitado') correo: string, @Req() req: Request, @Res() res: Response) {
    const token = req.headers['authorization'];
    if (typeof token !== 'string') return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Token no proporcionado' });

    const url = `http://microservicio-documentos:8082/documentos/compartidos?correoInvitado=${correo}`;
    return this.gatewayService.forwardGet(url, token, res);
  }

  @Get('/documentos/invitaciones')
  async invitacionesPorUsuario(@Query('correo') correo: string, @Req() req: Request, @Res() res: Response) {
    const token = req.headers['authorization'];
    if (typeof token !== 'string') return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Token no proporcionado' });

    const url = `http://microservicio-documentos:8082/documentos/invitaciones?correo=${correo}`;
    return this.gatewayService.forwardGet(url, token, res);
  }

  // ==== SUSCRIPCIONES ====

  @Post('/documentos/:id/suscribirse')
  async suscribirse(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const token = req.headers['authorization'];
    if (typeof token !== 'string') return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Token no proporcionado' });

    const { data } = await axios.get<AuthValidationResponse>('http://autenticacion:8081/auth/validate', {
      headers: { Authorization: token }
    });

    return this.gatewayService.forwardPostWithHeader(
      `http://microservicio-documentos:8082/documentos/${id}/suscribirse`,
      {},
      { 'X-Correo-Invitado': data.correo },
      res
    );
  }

  @Delete('/documentos/:id/suscribirse')
  async cancelarSuscripcion(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const token = req.headers['authorization'];
    if (typeof token !== 'string') return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Token no proporcionado' });

    const { data } = await axios.get<AuthValidationResponse>('http://autenticacion:8081/auth/validate', {
      headers: { Authorization: token }
    });

    return this.gatewayService.forwardDeleteWithHeader(
      `http://microservicio-documentos:8082/documentos/${id}/suscribirse`,
      { 'X-Correo-Invitado': data.correo },
      res
    );
  }

  @Get('/documentos/suscripciones')
  async listarSuscripciones(@Query('correo') correo: string, @Req() req: Request, @Res() res: Response) {
    const token = req.headers['authorization'];
    if (typeof token !== 'string') return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Token no proporcionado' });

    return this.gatewayService.forwardGet(
      `http://microservicio-documentos:8082/documentos/suscripciones?correo=${correo}`,
      token,
      res
    );
  }

  // ==== SOLICITUDES DE EDICIÓN ====

  @Post('/documentos/:id/solicitar-edicion')
  async solicitarEdicion(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const token = req.headers['authorization'];
    if (typeof token !== 'string') return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Token no proporcionado' });

    const { data } = await axios.get<AuthValidationResponse>('http://autenticacion:8081/auth/validate', {
      headers: { Authorization: token }
    });

    return this.gatewayService.forwardPostWithHeader(
      `http://microservicio-documentos:8082/documentos/${id}/solicitar-edicion`,
      {},
      { 'X-Correo-Invitado': data.correo },
      res
    );
  }

  @Patch('/documentos/solicitudes/:id')
  async responderSolicitud(@Param('id') id: string, @Query('aceptar') aceptar: string, @Req() req: Request, @Res() res: Response) {
    const token = req.headers['authorization'];
    if (typeof token !== 'string') return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Token no proporcionado' });

    const { data } = await axios.get<AuthValidationResponse>('http://autenticacion:8081/auth/validate', {
      headers: { Authorization: token }
    });

    return this.gatewayService.forwardPatchWithHeader(
      `http://microservicio-documentos:8082/documentos/solicitudes/${id}?aceptar=${aceptar}`,
      {},
      { 'X-Autor-Correo': data.correo },
      res
    );
  }

  @Get('/documentos/solicitudes/recibidas')
  async solicitudesRecibidas(@Query('correo') correo: string, @Req() req: Request, @Res() res: Response) {
    const token = req.headers['authorization'];
    if (typeof token !== 'string') return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Token no proporcionado' });

    return this.gatewayService.forwardGet(
      `http://microservicio-documentos:8082/documentos/solicitudes/recibidas?correo=${correo}`,
      token,
      res
    );
  }

  @Get('/documentos/solicitudes/enviadas')
  async solicitudesEnviadas(@Query('correo') correo: string, @Req() req: Request, @Res() res: Response) {
    const token = req.headers['authorization'];
    if (typeof token !== 'string') return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Token no proporcionado' });

    return this.gatewayService.forwardGet(
      `http://microservicio-documentos:8082/documentos/solicitudes/enviadas?correo=${correo}`,
      token,
      res
    );
  }

  /**
   * Permite al autor cambiar el rol de un colaborador ya aceptado (EDITOR ⇄ VISUALIZADOR)
   */
  @Patch('/documentos/:id/cambiar-rol')
  async cambiarRolInvitado(@Param('id') id: string,
                           @Query('correoInvitado') correoInvitado: string,
                           @Query('nuevoRol') nuevoRol: string,
                           @Req() req: Request,
                           @Res() res: Response) {
    const token = req.headers['authorization'];
    if (typeof token !== 'string') {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Token no proporcionado' });
    }

    try {
      const { data } = await axios.get<AuthValidationResponse>(
        'http://autenticacion:8081/auth/validate',
        { headers: { Authorization: token } }
      );

      if (!data.valid || !data.correo) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Token inválido' });
      }

      const url = `http://microservicio-documentos:8082/documentos/${id}/cambiar-rol`
                + `?correoInvitado=${correoInvitado}&nuevoRol=${nuevoRol}`;

      return this.gatewayService.forwardPatchWithHeader(
        url,
        {},
        { 'X-Autor-Correo': data.correo },
        res
      );
    } catch {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Error validando el token' });
    }
  }
}
