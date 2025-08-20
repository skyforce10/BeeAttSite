import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <>
    <App />
    <ToastContainer position="bottom-center" autoClose={false} newestOnTop />
  </>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
//serviceWorkerRegistration.register();  --old one 22/07/2025
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    toast.info(() => (
      <div>
        <strong>🔄 New version available</strong>
        <div>
          <button
            onClick={() => {
              registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
            }}
            style={{
              marginTop: 8,
              padding: '5px 10px',
              border: 'none',
              background: '#007bff',
              color: '#fff',
              cursor: 'pointer',
              borderRadius: 4,
            }}
          >
            Refresh Now
          </button>
        </div>
      </div>
    ), {
      closeOnClick: false,
      draggable: false,
      position: 'bottom-center',
      autoClose: 3000,
      toastId: 'sw-update',
    });
  },
});

navigator.serviceWorker.addEventListener('controllerchange', () => {
  window.location.reload();
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
