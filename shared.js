(function(){
"use strict";

function bufToHex(buf){
  return Array.prototype.map.call(new Uint8Array(buf), function(b){ return ('00'+b.toString(16)).slice(-2); }).join('');
}
async function sha256Hex(str){
  var enc = new TextEncoder().encode(str);
  var buf = await crypto.subtle.digest('SHA-256', enc);
  return bufToHex(buf);
}
async function hashPassword(password, salt){
  var value = salt + ':' + password;
  for(var i=0;i<2000;i++){
    value = await sha256Hex(value + ':' + salt);
  }
  return value;
}
function genSalt(){
  var arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.prototype.map.call(arr, function(b){ return ('00'+b.toString(16)).slice(-2); }).join('');
}

window.ChoirAuth = { sha256Hex: sha256Hex, hashPassword: hashPassword, genSalt: genSalt };

function cfg(){
  return {
    owner: localStorage.getItem('choir_gh_owner') || '',
    repo: localStorage.getItem('choir_gh_repo') || '',
    branch: localStorage.getItem('choir_gh_branch') || 'main',
    token: sessionStorage.getItem('choir_gh_token') || ''
  };
}
function saveCfg(owner, repo, branch, token){
  localStorage.setItem('choir_gh_owner', owner);
  localStorage.setItem('choir_gh_repo', repo);
  localStorage.setItem('choir_gh_branch', branch);
  if(token) sessionStorage.setItem('choir_gh_token', token);
}
function clearToken(){ sessionStorage.removeItem('choir_gh_token'); }
function hasConfig(){
  var c = cfg();
  return !!(c.owner && c.repo && c.branch && c.token);
}
function apiBase(c){ return 'https://api.github.com/repos/'+encodeURIComponent(c.owner)+'/'+encodeURIComponent(c.repo)+'/contents/'; }
function b64EncodeUnicode(str){ return btoa(unescape(encodeURIComponent(str))); }
function b64DecodeUnicode(str){ return decodeURIComponent(escape(atob(str))); }

async function apiRequest(path, options){
  var c = cfg();
  if(!c.token) throw new Error('Not connected to GitHub yet.');
  var headers = Object.assign({
    'Authorization': 'token ' + c.token,
    'Accept': 'application/vnd.github+json'
  }, (options && options.headers) || {});
  var res = await fetch(apiBase(c) + path + (options && options.query ? options.query : ''), {
    method: (options && options.method) || 'GET',
    headers: headers,
    body: options && options.body
  });
  return res;
}

async function getFile(path){
  var res = await apiRequest(path, { query: '?ref=' + encodeURIComponent(cfg().branch) });
  if(res.status === 404) return { sha: null, raw: null, json: null };
  if(!res.ok){
    var t = await res.text();
    throw new Error('GitHub API ' + res.status + ' on GET ' + path + ': ' + t);
  }
  var data = await res.json();
  var raw = b64DecodeUnicode(data.content.replace(/\n/g, ''));
  var parsed = null;
  try{ parsed = JSON.parse(raw); }catch(e){ parsed = null; }
  return { sha: data.sha, raw: raw, json: parsed };
}

async function putJson(path, obj, sha, message){
  var content = b64EncodeUnicode(JSON.stringify(obj, null, 2));
  var body = { message: message || ('Update ' + path), content: content, branch: cfg().branch };
  if(sha) body.sha = sha;
  var res = await apiRequest(path, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
  if(!res.ok){
    var t = await res.text();
    throw new Error('GitHub API ' + res.status + ' on PUT ' + path + ': ' + t);
  }
  return res.json();
}

async function putBinary(path, base64Content, sha, message){
  var body = { message: message || ('Add ' + path), content: base64Content, branch: cfg().branch };
  if(sha) body.sha = sha;
  var res = await apiRequest(path, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
  if(!res.ok){
    var t = await res.text();
    throw new Error('GitHub API ' + res.status + ' on PUT ' + path + ': ' + t);
  }
  return res.json();
}

async function deleteFile(path, sha, message){
  var body = { message: message || ('Delete ' + path), sha: sha, branch: cfg().branch };
  var res = await apiRequest(path, { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
  if(!res.ok){
    var t = await res.text();
    throw new Error('GitHub API ' + res.status + ' on DELETE ' + path + ': ' + t);
  }
  return res.json();
}

window.ChoirGitHub = {
  cfg: cfg, saveCfg: saveCfg, clearToken: clearToken, hasConfig: hasConfig,
  getFile: getFile, putJson: putJson, putBinary: putBinary, deleteFile: deleteFile
};

function escapeHtml(s){
  return String(s==null?'':s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
function nl2br(s){ return escapeHtml(s).replace(/\n/g,'<br>'); }
function formatDate(d){
  try{
    var dt = new Date(d+'T00:00:00');
    if(isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('en-US',{month:'long', day:'numeric', year:'numeric'});
  }catch(e){ return d; }
}
window.ChoirUtil = { escapeHtml: escapeHtml, nl2br: nl2br, formatDate: formatDate };

})();
