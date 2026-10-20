import { RateLimitError } from '../errors/index.js';

export function rateLimit({ maxRequests, windowMs }) {
  const solicitudesPorIp = new Map();

  return function limitarSolicitudes(req, res, next) {
    const ahora = Date.now();
    const ip = req.ip ?? req.socket.remoteAddress ?? 'desconocida';
    let ventana = solicitudesPorIp.get(ip);

    if (!ventana || ventana.venceEn <= ahora) {
      ventana = { cantidad: 0, venceEn: ahora + windowMs };
      solicitudesPorIp.set(ip, ventana);
    }

    ventana.cantidad += 1;
    res.setHeader('RateLimit-Limit', maxRequests);
    res.setHeader('RateLimit-Remaining', Math.max(0, maxRequests - ventana.cantidad));
    res.setHeader('RateLimit-Reset', Math.ceil(ventana.venceEn / 1000));

    if (ventana.cantidad > maxRequests) {
      res.setHeader('Retry-After', Math.max(1, Math.ceil((ventana.venceEn - ahora) / 1000)));
      return next(new RateLimitError(new Error('Se superó el límite de solicitudes por IP')));
    }

    if (solicitudesPorIp.size > 1000) {
      for (const [ipRegistrada, ventanaRegistrada] of solicitudesPorIp) {
        if (ventanaRegistrada.venceEn <= ahora) {
          solicitudesPorIp.delete(ipRegistrada);
        }
      }
    }

    return next();
  };
}
