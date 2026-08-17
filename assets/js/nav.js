/* ==========================================================================
   Mobile nav drawer — hamburger toggle, Escape/scrim/link-click to close.
   Progressive enhancement: without JS the drawer stays off-screen (CSS
   transform), so nothing breaks — the burger button just wouldn't open it.
   ========================================================================== */
(function(){
  'use strict';

  var burger = document.getElementById('nav-burger');
  var drawer = document.getElementById('nav-drawer');
  var closeBtn = document.getElementById('nav-drawer-close');
  var scrim = document.getElementById('nav-scrim');
  if(!burger || !drawer) return;

  function openDrawer(){
    drawer.classList.add('is-open');
    if(scrim) scrim.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    if(closeBtn) closeBtn.focus();
    document.documentElement.style.overflow = 'hidden'; // prevent background scroll while drawer is open
  }

  function closeDrawer(returnFocus){
    drawer.classList.remove('is-open');
    if(scrim) scrim.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
    if(returnFocus) burger.focus();
  }

  burger.addEventListener('click', function(){
    if(drawer.classList.contains('is-open')){ closeDrawer(true); } else { openDrawer(); }
  });

  if(closeBtn) closeBtn.addEventListener('click', function(){ closeDrawer(true); });
  if(scrim) scrim.addEventListener('click', function(){ closeDrawer(true); });

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer(true);
  });

  // Close automatically when a nav link is chosen (they're navigating away anyway)
  var links = drawer.querySelectorAll('a');
  for(var i=0; i<links.length; i++){
    links[i].addEventListener('click', function(){ closeDrawer(false); });
  }

  // If resized past the mobile breakpoint while open, reset state
  window.addEventListener('resize', function(){
    if(window.innerWidth > 859 && drawer.classList.contains('is-open')) closeDrawer(false);
  });
})();
