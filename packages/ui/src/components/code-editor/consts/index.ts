export const CCodeEditorCtx = Symbol('CCodeEditorCtx')

export const CCodeEditorToolbox = {
  IncrementFontSize: 'IncrementFontSize',
  DecrementFontSize: 'DecrementFontSize',
  ResetFontSize: 'ResetFontSize',
  Fomatter: 'Fomatter',
  ToggleMinimap: 'ToggleMinimap',
  ToggleReadOnly: 'ToggleReadOnly',
  ToggleWordWrap: 'ToggleWordWrap'
} as const

export const CCodeEditorShadow = {
  Default: 'default',
  Hover: 'hover'
} as const