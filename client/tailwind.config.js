export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "sans-serif"] },
      colors: {
        sidebar: "#1e293b",
        primary: "#2563eb",
        indigo: "#4f46e5",
      },
      boxShadow: {
        soft: "0 12px 35px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
