// icon: 🆙
// name: update
(()=>{
  const date=new Date();
  const element=id=>document.getElementById(id);
  const current={
    aa:element('aa').value,
    mm:element('mm').value,
    jj:element('jj').value,
    hh:element('hh').value,
    mn:element('mn').value
  };
  const prev=window._prevTimestamp;
  document.querySelector('.edit-timestamp').click();
  if(prev){
    Object.entries(prev).forEach(([key,value])=>element(key).value=value);
    window._prevTimestamp=null;
  }else{
    const pad=value=>String(value).padStart(2,'0');
    window._prevTimestamp=current;
    element('aa').value=date.getFullYear();
    element('mm').value=pad(date.getMonth()+1);
    element('jj').value=pad(date.getDate());
    element('hh').value=pad(date.getHours());
    element('mn').value=pad(date.getMinutes());
  }
  document.querySelector('.save-timestamp').click();
  element('updated').scrollIntoView({behavior:'smooth',block:'center'});
  element('updated').checked=true;
  element('updated').focus();
})()
