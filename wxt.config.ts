import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
  alias: {
    "@": path.resolve(__dirname, "./"),
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: "简资 Assetly",
    description: "极简本地化的个人资产管理工具",
    permissions: [
      "sidePanel",
      "storage",
      "activeTab",
      "tabs",
      "scripting",
      "desktopCapture",
    ],
    side_panel: {
      default_path: "sidepanel.html",
    },
    action: {
      default_title: "打开简资",
    },
    runner: {
      binaries: {
        edge: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      },
      chromiumArgs: ["--user-data-dir=./.wxt/browser-data"],
    },
  },
});
