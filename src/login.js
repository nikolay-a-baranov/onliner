// icon: 🔐
// name: login
(()=>{
  const params=new URLSearchParams(location.search);
  const post=params.get('post');
  const redirect=post
    ?location.origin+'/wp-admin/post.php?post='+post+'&action=edit'
    :location.origin+'/wp-admin/edit.php?';
  document.querySelector('#user_login').value='baranov';
  document.querySelector('#user_pass').value='PASTE_PASSWORD_HERE';
  document.querySelector('#rememberme').checked=true;
  document.querySelector("input[name='redirect_to']").value=redirect;
  document.querySelector('#wp-submit').click();
})();
