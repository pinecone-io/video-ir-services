/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundImage: () => ({
        'stripes': 'linear-gradient(45deg, #4169E1 25%, transparent 25%, transparent 50%, #4169E1 50%, #4169E1 75%, transparent 75%, transparent)',
     }),
      keyframes: {
        colorPulse: {
          '0%, 100%': { backgroundColor: '#4169E1' }, // medium blue
          '50%': { backgroundColor: '#00008b' }, // dark blue
        },
        'stripe-move': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(1rem)' },
        },
      },
      animation: {
        colorPulse: 'colorPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        stripeMove: 'stripe-move 0.2s linear infinite',

      },
      colors: {
        cta: {
          100: "#1C17FF",
        },

      
        primary: {
          100: "#2B2B2B",
          200: "rgba(0, 0, 0, 0.8)",
          300: "rgba(0, 0, 0, 0.1)",
          400: "#3B81F6",
          500: "#202A37",
          600: "#808182",
          700: "#01004B",
          800: "#1F2937",
          900: "#BDBDBD",
          1000: "#FAFAFA",
        },
        gray: {
          100: "#7F7F7G",
          200: "#F1F5F8",
          400: "#E9EBED",
          500: "#7F7F7F",
        },
        darkLabel: "#393939",
      },
      fontSize: {
        sm12: ["12px", "14px"],
        sm14: ["14px", "17px"],
        base15: ["15px", "18px"],
        base16: ["16px", "19px"],
        base18: ["18px", "47px"],
        base20: ["20px", "24px"],
        lg24: ["24px", "29px"],
        lg30: ["30px", "36px"],
      },
      margin: {
        mt10: "10px",
        mb42: "42px",
        mx40: "40px",
        mt93: "93px",
      },
      width: {
        controlsCircle: "30px",
        controlsPlayCircle: "58px",
        inputWidth: "580px",
        imageWidth: "125px",
      },
      height: {
        controlsCircle: "30px",
        controlsPlayCircle: "58px",
        imageHeight: "125px",
      },
      inset: {
        x45: ["45%", "45%"],
      },
      padding: {
        heading: "26px 78px 22px",
        footer: "39px 0 26px",
        overlay: "32px 40px 28px",
        controlsBtn: "10px",
        controlsPlayBtn: "0 15px 0 14px",
        labelControls: "63px 0 28px",
        submitBtn: "15px 60px",
        input: "15px 20px 8px",
        40: "40px",
      },
      borderWidth: {
        1: "1px",
        3: "3px",
        5: "5px",
        xs4: "0.4px",
      },
      borderRadius: {
        xl10: "10px",
        10: "0 0 10px 10px",
        50: "50%",
      },
    },
  },
  plugins: [],
};
