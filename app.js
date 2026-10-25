(() => {
  'use strict';
  const studio = window.STUDIO;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = n => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
  const today = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const offerActive = (day = today()) => day <= studio.courseOffer.validUntil;
  const price = format => format.id === 'course' ? (offerActive() ? money(studio.courseOffer.price) : 'Уточним у студии') : money(format.price);
  const selected = new Set();
  let filter = 'all', toastTimeout, resultFields = [], summaryText = '';
  const find = id => studio.formats.find(f => f.id === id);
  const go = id => $(id).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',block:'start'});
  function toast(text) { $('#toast').textContent = text; $('#toast').hidden = false; clearTimeout(toastTimeout); toastTimeout = setTimeout(() => $('#toast').hidden = true, 3300); }
  function renderCards() {
    const visible = studio.formats.filter(f => filter === 'all' || (filter === 'first' && f.first) || (filter === 'two' && f.id !== 'course') || (filter === 'course' && f.id === 'course'));
    $('#cards').innerHTML = visible.map(f => `<article class="card" data-format="${f.id}">
      <div class="card-image"><img src="assets/${f.image}" alt="${escapeHTML(f.photoCaption)}" loading="lazy"><span class="card-tag">${escapeHTML(f.for)}</span></div>
      <div class="card-top"><p class="eyebrow">${escapeHTML(f.eyebrow)}</p><button class="compare-toggle" data-compare="${f.id}" aria-pressed="${selected.has(f.id)}" aria-label="${selected.has(f.id) ? 'Убрать из сравнения' : 'Сравнить'}: ${escapeHTML(f.title)}"><span class="check-box" aria-hidden="true">${selected.has(f.id) ? '✓' : '+'}</span>Сравнить</button></div>
      <h3>${escapeHTML(f.title)}</h3><p class="card-description">${escapeHTML(f.description)}</p><p class="card-includes">${escapeHTML(f.includes)}</p>
      <div class="card-price-row"><span class="card-price">${price(f)}<small>${f.id === 'course' && !offerActive() ? '' : f.unit}</small></span><span class="card-duration">${f.duration}</span></div>
      ${f.id === 'course' ? `<p class="offer-note">${offerActive() ? 'Специальная цена до 31 октября 2026' : 'Цену курса уточните у администратора'}</p>` : ''}
      ${f.note ? `<p class="card-extra-note">${escapeHTML(f.note)}</p>` : ''}
      <div class="card-actions">${f.id === 'course' ? `<button class="button primary" data-choose="course">Обсудить курс <span aria-hidden="true">↗</span></button>` : `<a class="button outline" href="${studio.booking}" data-booking target="_blank" rel="noopener">Посмотреть расписание <span aria-hidden="true">↗</span></a><button class="request-link" data-choose="${f.id}">Задать вопрос о занятии →</button>`}</div>
    </article>`).join('');
  }
  function setFilter(value, scroll = false) {
    filter = value;
    $$('[data-filter]').forEach(b => { b.classList.toggle('active',b.dataset.filter === value); b.setAttribute('aria-pressed',b.dataset.filter === value); });
    $('#intent-note').hidden = !['two','first','course'].includes(value);
    $('#intent-note').textContent = value === 'two' ? 'Можно взять два места на обычном занятии: цена указана за человека, с вами могут быть другие гости. Если хотите заниматься только вдвоём с мастером — выбирайте «Свидание». Оно стоит 12 000 ₽ за двоих, с фуршетом и напитками.' : value === 'course' ? 'В курсе 8 занятий, в группе до двух человек. Ещё будет 15 часов самостоятельной практики. Время занятий подберём с мастером.' : 'Без опыта можно прийти на ручную лепку, тарелки на пуансонах или нерияги. Если больше хочется за гончарный круг — спросите администратора, с чего начать.';
    renderCards(); if (scroll) go('#formats');
  }
  function renderCompare() {
    const count = selected.size;
    $('#compare-count').textContent = `${count} / 3`;
    $('#compare-open').disabled = count < 2;
    $('#tray-open').disabled = count < 2;
    $('#tray-label').textContent = `Для сравнения: ${count} из 3`;
    $('#compare-tray').hidden = count === 0;
    $('#compare-hint').textContent = count === 0 ? 'Нажмите «Сравнить» на карточках выше.' : count === 1 ? 'Добавьте ещё одно занятие для сравнения.' : 'Теперь можно открыть сравнение.';
    $('#compare-chips').innerHTML = [...selected].map(id => `<span class="compare-chip">${escapeHTML(find(id).title)}<button data-remove="${id}" aria-label="Убрать ${escapeHTML(find(id).title)} из сравнения">×</button></span>`).join('');
    $$('[data-compare]').forEach(b => { const on = selected.has(b.dataset.compare); b.setAttribute('aria-pressed',on); b.setAttribute('aria-label',`${on ? 'Убрать из сравнения' : 'Сравнить'}: ${find(b.dataset.compare).title}`); $('.check-box',b).textContent = on ? '✓' : '+'; });
  }
  function toggleCompare(id) { if (selected.has(id)) selected.delete(id); else if (selected.size < 3) selected.add(id); else { toast('Можно сравнить до трёх занятий. Сначала уберите одно.'); return; } renderCompare(); }
  function openComparison() {
    if (selected.size < 2) return;
    const formats = [...selected].map(find);
    const rows = [['Техника',f => f.technique],['Занятие или курс',f => f.type],['С кем будете заниматься',f => f.group],['Длительность',f => f.duration],['Стоимость',f => price(f) + (f.id === 'course' && !offerActive() ? '' : ' ' + f.unit) + (f.id === 'course' && offerActive() ? ' · до 31.10.2026' : '')],['Материалы',f => f.materials],['Обжиги',f => f.firing],['Когда забрать работу',f => f.ready],['Что ещё входит',f => f.includes]];
    $('#comparison-table').innerHTML = `<caption class="sr-only">Сравнение выбранных занятий студии</caption><thead><tr><th scope="col">Ваш выбор</th>${formats.map(f => `<th scope="col">${escapeHTML(f.title)}</th>`).join('')}</tr></thead><tbody>${rows.map(([label,fn]) => `<tr><th scope="row">${label}</th>${formats.map(f => `<td>${escapeHTML(fn(f))}</td>`).join('')}</tr>`).join('')}<tr><th scope="row">Следующий шаг</th>${formats.map(f => `<td>${f.id === 'course' ? `<button class="button primary" data-choose="course">Обсудить курс ↗</button>` : `<a class="button primary" href="${studio.booking}" target="_blank" rel="noopener">К расписанию ↗</a>`}</td>`).join('')}</tr></tbody>`;
    $('#compare-dialog').showModal();
  }
  function updateForm() {
    const id = $('#format').value;
    $('#gift-fields').hidden = id !== 'gift';
    const participants = $('#participants');
    [...participants.options].forEach(o => o.disabled = (id === 'date' && o.value !== '2') || (['gift','course'].includes(id) && !['1','2'].includes(o.value)));
    if (id === 'date') participants.value = '2';
    if (['gift','course'].includes(id) && !['1','2'].includes(participants.value)) participants.value = '1';
    participants.disabled = id === 'date';
    const f = find(id);
    $('#format-help').textContent = id === 'gift' ? 'Цену, срок действия и оформление сертификата подскажет администратор.' : id === 'course' ? (offerActive() ? 'До 31 октября 2026 курс стоит 25 000 ₽. Время занятий подберём с мастером.' : 'Цену курса и время занятий подскажет администратор.') : id === 'date' ? 'Только вы вдвоём и мастер. 2,5 часа, 12 000 ₽ за двоих. Фуршет и напитки входят в цену.' : id === 'neriagi' && participants.value === '2' ? 'В записи указано 4 800 ₽ за человека. Если вас двое, уточните парную цену у администратора.' : f ? `${f.duration} · ${price(f)} ${f.unit}. Свободное время смотрите в записи студии.` : 'Если пока не выбрали занятие, расскажите об этом в комментарии.';
    $('#date-field').hidden = $('#unknown-date').checked;
    $('#date').disabled = $('#unknown-date').checked;
    $('#date').min = today();
  }
  function step(number) {
    $('#request-form').hidden = number === 3;
    $('#form-result').hidden = number !== 3;
    $('#form-step-1').hidden = number !== 1;
    $('#form-step-2').hidden = number !== 2;
    [1,2,3].forEach(i => $('#step-label-'+i).classList.toggle('active',i === number));
  }
  function choose(id) {
    $$('dialog[open]').forEach(d => d.close());
    $('#format').value = id;
    updateForm(); step(1); go('#request');
  }
  function error(id,message) { const input=$('#'+id); const box=$('#'+id+'-error'); box.textContent=message;box.hidden=!message;input.setAttribute('aria-invalid',Boolean(message)); }
  function validateDate() { const bad=!$('#unknown-date').checked && (!$('#date').value || $('#date').value < today()); error('date',bad ? 'Выберите дату не раньше сегодняшней. Если пока не знаете, поставьте галочку «С датой пока не определились».' : '');if(bad)$('#date').focus();return !bad; }
  function validContact(value) {
    const v=value.trim();
    return /^@[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(v) || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || (/^\+?[\d\s()\-]+$/.test(v) && /^\d{10,15}$/.test(v.replace(/\D/g,'')));
  }
  function createSummary() {
    const id=$('#format').value;
    const date=$('#unknown-date').checked ? 'Пока не определились' : new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(new Date($('#date').value+'T12:00:00'));
    const fields=[['Формат',find(id)?.title || (id==='gift'?'Подарок / сертификат':'Помогите выбрать / другой вопрос')],['Участники',$('#participants').value],['Желаемая дата',date],['Удобное время',$('#time').value]];
    if(id==='gift')fields.push(['Подарок',$('#gift-kind').value],['Интересует занятие',$('#gift-preference').value]);
    fields.push(['Имя',$('#name').value.trim()],['Контакт',$('#contact').value.trim()],['Комментарий',$('#comment').value.trim() || 'Без комментария']);
    if(id==='neriagi' && $('#participants').value==='2')fields.push(['Уточнить','Сколько стоит нерияги для двоих']);
    resultFields=fields;
    const greeting=id==='gift' ? 'Здравствуйте! Хочу подарить занятие в вашей студии.' : id==='course' ? 'Здравствуйте! Хочу узнать про курс по гончарному кругу.' : id==='custom' ? 'Здравствуйте! Помогите, пожалуйста, выбрать занятие.' : 'Здравствуйте! Хочу записаться на занятие.';
    summaryText=greeting+'\n\n'+fields.map(([k,v]) => k+': '+v).join('\n')+'\n\nПо дате и времени пока хочу уточнить.\nЭто пример заявки. Сообщение не отправлено.';
    $('#summary').textContent=summaryText;
    $('#admin-details').innerHTML=fields.map(([k,v])=>`<dt>${escapeHTML(k)}</dt><dd>${escapeHTML(v)}</dd>`).join('');
    step(3);
  }
  document.addEventListener('click', e => {
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.filter)setFilter(b.dataset.filter);
    if(b.dataset.intent){const v=b.dataset.intent;if(v==='gift')choose('gift');else{setFilter(v,true);if(v==='course')$('#format').value='course';}}
    if(b.dataset.compare)toggleCompare(b.dataset.compare);
    if(b.dataset.remove){selected.delete(b.dataset.remove);renderCompare();}
    if(b.dataset.choose)choose(b.dataset.choose);
    if(b.dataset.close)$('#'+b.dataset.close).close();
  });
  ['compare-open','tray-open'].forEach(id => $('#'+id).addEventListener('click',openComparison));
  $('#clear-compare').addEventListener('click',()=>{selected.clear();renderCompare();});
  ['format','participants','unknown-date'].forEach(id=>$('#'+id).addEventListener('change',updateForm));
  $('#next-step').addEventListener('click',()=>{if(validateDate()){step(2);$('#name').focus({preventScroll:true});}});
  $('#back-step').addEventListener('click',()=>step(1));
  $('#edit-request').addEventListener('click',()=>step(1));
  $('#request-form').addEventListener('submit',e=>{e.preventDefault();if(!validateDate()){step(1);return;}const nameOK=$('#name').value.trim().length>=2;const contactOK=validContact($('#contact').value);error('name',nameOK?'':'Напишите имя — хотя бы 2 символа.');error('contact',contactOK?'':'Проверьте контакт. Подойдёт телефон из 10–15 цифр, Telegram @username (от 5 знаков после @) или email.');if(!nameOK||!contactOK){(!nameOK?$('#name'):$('#contact')).focus();return;}createSummary();});
  $('#copy-summary').addEventListener('click',async()=>{
    let copied=false;
    try{if(navigator.clipboard && window.isSecureContext){await navigator.clipboard.writeText(summaryText);copied=true;}else{const t=document.createElement('textarea');t.value=summaryText;t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();copied=document.execCommand('copy');t.remove();}}
    catch{copied=false;}
    if(copied){toast('Текст заявки скопирован');$('#copy-summary').firstChild.textContent='Текст скопирован ';}
    else{toast('Выделите текст заявки и скопируйте вручную.');const selection=window.getSelection();const range=document.createRange();range.selectNodeContents($('#summary'));selection.removeAllRanges();selection.addRange(range);}
  });
  $('#admin-view').addEventListener('click',()=>$('#admin-dialog').showModal());
  $$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){renderCards();updateForm();}});
  setFilter('all');renderCompare();updateForm();
})();
