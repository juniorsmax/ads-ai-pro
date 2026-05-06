const { body, param, validationResult } = require('express-validator')

// Devuelve 422 con los errores si la validación falla
function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Datos inválidos',
      detalles: errors.array().map(e => ({ campo: e.path, mensaje: e.msg })),
    })
  }
  next()
}

// ── Reglas por ruta ──────────────────────────────────────────────────────────

const authCallback = [
  body('code').isString().notEmpty().withMessage('Código de autorización requerido'),
  validate,
]

const linkAccount = [
  body('customerId').isString().notEmpty().withMessage('customerId requerido'),
  body('nombre').optional().isString().isLength({ max: 100 }),
  validate,
]

const aiChat = [
  body('mensaje').isString().trim().notEmpty().withMessage('El mensaje no puede estar vacío')
    .isLength({ max: 2000 }).withMessage('El mensaje no puede superar 2000 caracteres'),
  body('cuentaId').optional().isUUID().withMessage('cuentaId debe ser un UUID válido'),
  body('historial').optional().isArray().withMessage('historial debe ser un array'),
  validate,
]

const aiAnalyze = [
  body('cuentaId').isUUID().withMessage('cuentaId debe ser un UUID válido'),
  validate,
]

const aiOptimize = [
  body('cuentaId').isUUID().withMessage('cuentaId debe ser un UUID válido'),
  body('objetivos').optional().isObject(),
  validate,
]

const aiCopy = [
  body('tipo').optional().isIn(['RSA', 'PMax', 'Display']).withMessage('tipo debe ser RSA, PMax o Display'),
  body('keywords').optional().isArray(),
  validate,
]

const aiCopyAudit = [
  body('copies').isArray({ min: 1 }).withMessage('copies debe ser un array no vacío'),
  validate,
]

const aiAlertsCheck = [
  body('cuentaId').isUUID().withMessage('cuentaId debe ser un UUID válido'),
  validate,
]

const waitlistSignup = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('nombre').optional().isString().trim().isLength({ max: 100 }),
  body('tipo').optional().isIn(['autonomo', 'empresa', 'agencia', 'otro']),
  validate,
]

const feedbackCreate = [
  body('tipo').isIn(['bug', 'sugerencia', 'comentario']).withMessage('tipo debe ser bug, sugerencia o comentario'),
  body('mensaje').isString().trim().notEmpty().withMessage('El mensaje es requerido')
    .isLength({ min: 10, max: 2000 }).withMessage('El mensaje debe tener entre 10 y 2000 caracteres'),
  body('nps').optional({ nullable: true }).isInt({ min: 0, max: 10 }).withMessage('NPS debe ser un número entre 0 y 10'),
  body('pagina').optional().isString().isLength({ max: 200 }),
  validate,
]

const whitelabelSave = [
  body('nombre').optional().isString().trim().isLength({ max: 100 }),
  body('logo_url').optional({ nullable: true }).isURL().withMessage('logo_url debe ser una URL válida'),
  body('color_primario').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('color_primario debe ser un color hexadecimal (#rrggbb)'),
  body('dominio_personalizado').optional({ nullable: true }).isString().trim().isLength({ max: 253 }),
  validate,
]

module.exports = {
  authCallback,
  linkAccount,
  aiChat,
  aiAnalyze,
  aiOptimize,
  aiCopy,
  aiCopyAudit,
  aiAlertsCheck,
  waitlistSignup,
  feedbackCreate,
  whitelabelSave,
}
