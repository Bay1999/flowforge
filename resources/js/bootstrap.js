import axios from 'axios';
import Swal from 'sweetalert2';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const token = localStorage.getItem('token');
if (token) {
  window.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

window.axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response && error.response.status !== 422) {
      // Show generic error notification using SweetAlert2
      const message = error.response.data?.message || error.message || 'An unexpected error occurred';
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: message,
        confirmButtonColor: '#4F46E5',
      });
    }
    return Promise.reject(error);
  }
);
