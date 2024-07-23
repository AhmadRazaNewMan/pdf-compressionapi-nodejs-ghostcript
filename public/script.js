document.getElementById('upload-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  
  const formData = new FormData();
  const fileInput = document.getElementById('file-input');
  formData.append('file', fileInput.files[0]);

  try {
    const response = await fetch('http://localhost:9000/compress', {  // Update the URL to the correct one
      method: 'POST',
      body: formData
    });

    const messageDiv = document.getElementById('message');

    if (response.ok) {
      // Create a download link dynamically
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'compressed.pdf';  // You can customize the download file name
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      messageDiv.innerHTML = '<p>PDF compressed successfully. The file should be downloading now.</p>';
    } else {
      const result = await response.json();
      messageDiv.textContent = `Error: ${result.error}`;
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('message').textContent = 'Error compressing PDF';
  }
});
