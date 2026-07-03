import "./globals.css";

export const metadata = {
  title: "TeleFinance Dashboard",
  description: "Dashboard keuangan pribadi dari Tele-Finance Bot",
};

// Runs before paint to avoid a light/dark flash on load.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("telefinance-theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = stored ? stored === "dark" : prefersDark;
    if (isDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
