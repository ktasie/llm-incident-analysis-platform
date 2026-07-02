const domStrings = {
  imageId: document.querySelector('#imageId'),
  authorEmail: document.querySelector('#authorEmail'),
  commentText: document.querySelector('#commentText'),
  commentField: document.querySelector('.comment'),
  form: document.querySelector('form'),
  like: document.querySelector('#like'),
  postLikes: document.querySelector('.post-likes'),
};

// console.log(parseInt(domStrings.postLikes.textContent, 10));
const clearFields = () => {
  domStrings.commentText.value = '';
  return;
};

const submitComment = async (e) => {
  e.preventDefault();
  //console.log(domStrings.imageId, domStrings.commentText);
  try {
    const raw = JSON.stringify({
      imageId: document.querySelector('#imageId').value,
      commentText: document.querySelector('#commentText').value,
    });

    // fetch options.
    const requestOptions = {
      method: 'POST',
      headers: { 'content-Type': 'application/json' },
      body: raw,
      credentials: 'include',
    };

    const response = await fetch(`${window.apiUrl}/comment`, requestOptions);
    if (!response.ok) {
      //const err = await response.json();
      //throw new Error(`${err.message}`);
      // HTTP error (4xx / 5xx)
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.status === 'success') {
      //console.log(result);

      const el = `<p><strong>${domStrings.authorEmail.value}</strong> ${
        document.querySelector('#commentText').value
      }</p>`;
      clearFields();

      domStrings.commentField.insertAdjacentHTML('beforeend', el);
    } else if (result.status === 'fail') {
      throw new Error(`${result.message}`);
    }
  } catch (err) {
    alert('Comment submission failed. Please try again later.');
    console.log(err);
  }
};

const likePhoto = async (e) => {
  //   const targetType = 'photo';

  e.preventDefault();
  //console.log(domStrings.imageId, domStrings.commentText);
  try {
    const raw = JSON.stringify({
      targetType: 'photo',
    });

    // fetch options.
    const requestOptions = {
      method: 'POST',
      headers: { 'content-Type': 'application/json' },
      body: raw,
      credentials: 'include',
    };

    const response = await fetch(`${window.apiUrl}/like/${domStrings.imageId.value}`, requestOptions);
    if (!response.ok) {
      // HTTP error (4xx / 5xx)
      throw new Error(`HTTP error! status: ${response.ok}`);
    }
    const result = await response.json();
    if (result.status === 'success') {
      let currNos = parseInt(domStrings.postLikes.textContent, 10);
      currNos++;
      console.log(currNos);
      domStrings.postLikes.textContent = `${currNos} likes`;
    } else if (result.status === 'fail') {
      throw new Error(`${result.message}`);
    }
  } catch (err) {
    alert('Photo already liked');
    console.log(err);
  }
};

domStrings.form.addEventListener('submit', submitComment);
domStrings.like.addEventListener('click', likePhoto);
