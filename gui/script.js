window.addEventListener('load', () => {
  if(window.location.hash !== '#failed') {
    document.querySelector('#wrongpass').style.display = 'none';
  }
  if(window.location.hash === '#success') {
    TweenLite.to(document.querySelector('main'), 1.5, { ease: Back.easeIn, y: -500 });
    setTimeout(() => {
      document.querySelector('iframe.preview').classList.remove('blurred');
      document.querySelector('iframe.preview').classList.add('active');
      setTimeout(() => {
        window.location.replace('/editor');
      }, 1500);
    }, 1500);
  }
  // set iframe src
  document.querySelector('iframe.preview').src = `http://${window.location.hostname}:80`;
});

window.addEventListener('submit', () => {
  // hash password
  var password = document.querySelector('input[type="password"]').value;
  document.querySelector('input[name="password"]').value = sha256(password);
  return true;
});
