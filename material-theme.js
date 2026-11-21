import { createTheme } from '@material-ui/core/styles';

/**
 * Material UI theme — mirrors the design tokens in docs/css/mixin.scss so the
 * Material components (buttons, fields, tabs, menus) match the rest of the UI.
 */
const navy = '#1b2a5f';
const navyDark = '#132048';
const accent = '#2f5bea';
const heading = '#101a3d';
const text = '#5b6478';
const muted = '#8a93a8';
const border = '#e7eaf4';
const inputBg = '#f4f6fd';
const fontFamily =
  "'Inter', 'Plus Jakarta Sans', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif";

export default createTheme({
  palette: {
    type: 'light',
    primary: { main: navy, dark: navyDark, contrastText: '#ffffff' },
    secondary: { main: accent, contrastText: '#ffffff' },
    success: { main: '#1f9d6b' },
    warning: { main: '#d99425' },
    error: { main: '#d64545' },
    info: { main: '#2f7fd4' },
    text: { primary: heading, secondary: text, disabled: muted },
    background: { default: '#f7f8fc', paper: '#ffffff' },
    divider: border,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily,
    fontSize: 13.5,
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    body1: { fontSize: 13.5 },
    body2: { fontSize: 13 },
  },
  overrides: {
    MuiButton: {
      root: {
        minHeight: 42,
        padding: '8px 20px',
        borderRadius: 12,
        boxShadow: 'none',
        textTransform: 'none',
        fontWeight: 600,
        '&:hover': { boxShadow: 'none' },
      },
      containedPrimary: {
        background: 'linear-gradient(135deg, #2f5bea 0%, #5b5ee8 52%, #8a5cf0 100%)',
        backgroundColor: accent,
        color: '#ffffff',
        boxShadow: '0 10px 22px rgba(47, 91, 234, 0.24)',
        '&:hover': {
          background: 'linear-gradient(135deg, #2850d6 0%, #514fe0 52%, #7c4de8 100%)',
          backgroundColor: '#2850d6',
          boxShadow: '0 14px 30px rgba(47, 91, 234, 0.3)',
        },
      },
      outlined: {
        borderColor: border,
        backgroundColor: '#ffffff',
        color: heading,
        '&:hover': { borderColor: '#d3d9ef', backgroundColor: '#fbfcff' },
      },
      textPrimary: { color: navy },
    },
    MuiFilledInput: {
      root: {
        backgroundColor: inputBg,
        borderRadius: 12,
        border: '1px solid transparent',
        '&:hover': { backgroundColor: '#eef1fb' },
        '&.Mui-focused': { backgroundColor: '#ffffff', borderColor: navy },
        '&:before, &:after': { borderBottom: 'none' },
      },
      input: { padding: '24px 14px 8px', fontSize: 13.5 },
      underline: {
        '&:before, &:after': { borderBottom: 'none' },
      },
    },
    MuiOutlinedInput: {
      root: {
        backgroundColor: inputBg,
        borderRadius: 12,
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: navy,
          borderWidth: '1.5px',
        },
      },
      notchedOutline: { borderColor: 'transparent' },
    },
    MuiInputLabel: {
      root: { fontWeight: 600, color: heading },
      shrink: { fontWeight: 600 },
      outlined: { color: heading },
    },
    MuiFormLabel: { root: { fontWeight: 600, color: heading } },
    MuiInput: { underline: { '&:before, &:after': { borderBottomColor: border } } },
    MuiSelect: { icon: { color: muted } },
    MuiTab: {
      root: {
        textTransform: 'none',
        fontWeight: 600,
        fontFamily,
        color: muted,
        '&$selected': { color: navy },
      },
    },
    MuiTabs: { indicator: { backgroundColor: navy, height: 3, borderRadius: 3 } },
    MuiPaper: { rounded: { borderRadius: 12 } },
    MuiMenu: { paper: { borderRadius: 12, border: `1px solid ${border}` } },
    MuiMenuItem: {
      root: {
        fontSize: 13.5,
        minHeight: 40,
        '&$selected': { backgroundColor: '#eef1fb', color: navy, fontWeight: 600 },
      },
    },
    MuiFormControlLabel: { label: { fontSize: 13.5 } },
    MuiCheckbox: { root: { color: '#b7bfd6' } },
    MuiRadio: { root: { color: '#b7bfd6' } },
    MuiFab: { root: { boxShadow: 'none' } },
    MuiTooltip: {
      tooltip: {
        backgroundColor: navy,
        fontSize: 12,
        borderRadius: 8,
        padding: '8px 10px',
      },
    },
  },
});
