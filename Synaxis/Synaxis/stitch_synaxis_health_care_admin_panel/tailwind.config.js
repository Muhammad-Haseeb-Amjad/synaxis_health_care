export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                background: '#0b1326', surface: '#0b1326', 'surface-container-lowest': '#060e20',
                'surface-container-low': '#131b2e', 'surface-container': '#171f33',
                'surface-container-high': '#222a3d', 'surface-container-highest': '#2d3449',
                'surface-bright': '#31394d', 'on-surface': '#dae2fd', 'on-surface-variant': '#bbcabf',
                outline: '#86948a', 'outline-variant': '#3c4a42', primary: '#4edea3',
                'on-primary': '#003824', 'primary-container': '#10b981', secondary: '#d0bcff',
                'secondary-container': '#571bc1', tertiary: '#89ceff', 'tertiary-container': '#23acf1',
                error: '#ffb4ab', 'error-container': '#93000a',
            },
            fontFamily: { sans: ['Inter', 'sans-serif'], heading: ['Manrope', 'sans-serif'] },
            fontSize: {
                'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '800' }],
                'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '700' }],
                'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
                'headline-sm': ['20px', { lineHeight: '28px', fontWeight: '600' }],
                'body-lg': ['18px', { lineHeight: '28px' }], 'body-md': ['16px', { lineHeight: '24px' }],
                'body-sm': ['14px', { lineHeight: '20px' }],
                'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
                'label-sm': ['11px', { lineHeight: '14px', fontWeight: '500' }],
            },
            borderRadius: { xl: '1.5rem' },
            spacing: { sidebar: '280px', 'content-max': '1440px', gutter: '24px', desktop: '40px', mobile: '16px' },
        },
    },
    plugins: [],
};
