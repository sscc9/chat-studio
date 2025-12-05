/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "jotai";
import { ChatLayout } from "./src/components/ChatLayout";
import './src/styles/global.css';

const App = () => {
  return (
    <Provider>
      <ChatLayout />
    </Provider>
  );
};

const container = document.getElementById("root");
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}