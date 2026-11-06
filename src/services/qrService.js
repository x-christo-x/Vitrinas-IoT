import { APP_CONFIG } from '../config/appConfig';

/**
 * Parsea y valida localmente el contenido de un código QR escaneado.
 * 
 * Estructura esperada:
 * {
 *   "type": "VITRINA_IOT_AUTH",
 *   "groupId": "grupo_01",
 *   "vId": "vitrinas_01",
 *   "token": "...",
 *   "ts": 1760000000000,
 *   "exp": 1760000030000
 * }
 */
export const parseAndValidateQR = (rawData) => {
  if (!rawData || typeof rawData !== 'string') {
    return {
      valid: false,
      code: 'INVALID_FORMAT',
      message: 'El código escaneado está vacío o no es legible.'
    };
  }

  // 1. Intentar JSON.parse()
  let parsed;
  try {
    parsed = JSON.parse(rawData.trim());
  } catch (err) {
    return {
      valid: false,
      code: 'INVALID_JSON',
      message: 'El código escaneado no tiene un formato válido de Vitrina IoT.'
    };
  }

  // 2. Verificar que sea un objeto
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      valid: false,
      code: 'INVALID_OBJECT',
      message: 'El contenido del código QR no es un objeto válido.'
    };
  }

  // 3. Verificar tipo de protocolo
  if (parsed.type !== APP_CONFIG.qrExpectedType) {
    return {
      valid: false,
      code: 'INVALID_TYPE',
      message: 'El código no corresponde al protocolo de autenticación de Vitrina IoT.'
    };
  }

  // 4 & 5. Verificar campos obligatorios y tipos razonables
  const { groupId, vId, token, ts, exp } = parsed;

  if (typeof groupId !== 'string' || !groupId.trim()) {
    return {
      valid: false,
      code: 'MISSING_GROUP',
      message: 'El código QR no contiene un identificador de grupo válido.'
    };
  }

  if (typeof vId !== 'string' || !vId.trim()) {
    return {
      valid: false,
      code: 'MISSING_VID',
      message: 'El código QR no identifica ninguna vitrina.'
    };
  }

  if (typeof token !== 'string' || !token.trim()) {
    return {
      valid: false,
      code: 'MISSING_TOKEN',
      message: 'El código QR carece del token de seguridad.'
    };
  }

  if (typeof ts !== 'number' || isNaN(ts) || typeof exp !== 'number' || isNaN(exp)) {
    return {
      valid: false,
      code: 'INVALID_TIMESTAMPS',
      message: 'Las marcas de tiempo del código QR son inválidas.'
    };
  }

  // 6. Verificar expiración local (tiempo actual vs exp)
  const now = Date.now();
  if (now > exp) {
    return {
      valid: false,
      code: 'QR_EXPIRED',
      message: 'El código QR ha expirado. Espera a que la pantalla genere uno nuevo.'
    };
  }

  // 7. Verificar que pertenezca al grupo configurado
  if (groupId !== APP_CONFIG.groupId) {
    return {
      valid: false,
      code: 'INVALID_GROUP',
      message: 'Esta vitrina pertenece a otro grupo.'
    };
  }

  // Todo es válido
  return {
    valid: true,
    data: {
      type: parsed.type,
      groupId: parsed.groupId,
      vId: parsed.vId,
      token: parsed.token,
      ts: parsed.ts,
      exp: parsed.exp
    }
  };
};

