function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    document.querySelector('.upload-area .upload-text').textContent = file.name;
  }
}

const domStrings = {
  title: document.querySelector('#title'),
  captionInput: document.querySelector('#captionInput'),
  location: document.querySelector('#location'),
  peoplePresent: document.querySelector('#peoplePresent'),
  fileInput: document.querySelector('#fileInput'),
  uploadBtn: document.querySelector('#upload'),
  notice: document.querySelector('.notice'),
};

const clearFields = () => {
  domStrings.title.value = '';
  domStrings.captionInput.value = '';
  domStrings.location.value = '';
  domStrings.peoplePresent.value = '';
  domStrings.fileInput.value = '';

  return;
};

const uploadForm = async (e) => {
  try {
    e.preventDefault();
    // console.log('clicked')
    //console.log(domStrings.fileInput.files[0].name);
    const formdata = new FormData();
    formdata.append('image', domStrings.fileInput.files[0], domStrings.fileInput.files[0].name);
    formdata.append('title', domStrings.title.value);
    formdata.append('caption', domStrings.captionInput.value);
    formdata.append('location', domStrings.location.value);
    formdata.append('peoplePresent', domStrings.peoplePresent.value);

    // fetch options.
    const requestOptions = {
      method: 'POST',
      body: formdata,
      credentials: 'include',
      redirect: 'follow',
    };

    const response = await fetch(`${window.apiUrl}/upload`, requestOptions);
    if (!response.ok) {
      // HTTP error (4xx / 5xx)
      const error = await response.json();
      //console.log(error);
      throw new Error(`${error.message}`);
    }
    const result = await response.json();
    if (result.status === 'success') {
      //console.log(result);
      clearFields();
      document.querySelector('.upload-area .upload-text').textContent = 'Drag photos here';
      domStrings.notice.textContent = 'Upload was successful! ...';
      domStrings.notice.style.backgroundColor = 'green';
    } else if (result.status === 'fail') {
      throw new Error(`${result.message}`);
    }
  } catch (err) {
    clearFields();
    document.querySelector('.upload-area .upload-text').textContent = 'Drag photos here';
    domStrings.notice.textContent = `${err.message}`;
    domStrings.notice.style.backgroundColor = 'red';
    // console.log(err);
  }
};

domStrings.uploadBtn.addEventListener('click', uploadForm);
