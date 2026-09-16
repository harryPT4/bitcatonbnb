/* set before anything paints so the chosen skin never flashes */
  try{
    if(localStorage.getItem('bitcat-theme') === 'night'){
      document.documentElement.setAttribute('data-theme', 'night');
    }
  }catch(e){}
