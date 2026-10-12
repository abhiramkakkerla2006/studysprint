import { useEffect, useMemo, useState } from 'react';

const emptyForm = { title: '', course: '', dueDate: '', priority: 'Medium' };
const icons = {
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  check: <><path d="m5 12 4 4L19 6"/></>,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
  arrow: <><path d="M7 17 17 7M7 7h10v10"/></>,
  trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></>,
  close: <><path d="m18 6-12 12M6 6l12 12"/></>,
  spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z"/></>
};
function Icon({ name, size = 18 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>; }
function dateLabel(value) { const date = new Date(`${value.slice(0, 10)}T00:00:00`); return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date); }
function relativeDue(value, completed) {
  if (completed) return 'Completed';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(`${value.slice(0, 10)}T00:00:00`);
  const days = Math.round((due - today) / 86400000);
  if (days < 0) return `${Math.abs(days)} day${days === -1 ? '' : 's'} overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 7) return `Due in ${days} days`;
  return `Due ${dateLabel(value)}`;
}
function AssignmentForm({ initial, onClose, onSave, saving }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setError('');
    try { await onSave(form); onClose(); } catch (err) { setError(err.message); }
  }
  return <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-head"><div><p className="eyebrow">{initial ? 'KEEP IT UP TO DATE' : 'MAKE A LITTLE PLAN'}</p><h2 id="modal-title">{initial ? 'Edit assignment' : 'Add an assignment'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" /></button></div>
      <form onSubmit={submit} className="form-stack">
        <label>Assignment name<input required maxLength="120" autoFocus placeholder="e.g. Research paper draft" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
        <label>Course<input required maxLength="60" placeholder="e.g. Environmental Science" value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} /></label>
        <div className="form-row"><label>Due date<input required type="date" value={form.dueDate?.slice(0, 10) || ''} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></label><label>Priority<select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : initial ? 'Save changes' : 'Add assignment'}</button></div>
      </form>
    </section>
  </div>;
}

export default function App() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('All work');
  const [query, setQuery] = useState('');
  async function request(path, options) {
    const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
    if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.message || 'Something went wrong. Please try again.'); }
    return response.status === 204 ? null : response.json();
  }
  async function loadAssignments() {
    setLoading(true);
    try { setAssignments(await request('/api/assignments')); setNotice(''); }
    catch (error) { setNotice(`${error.message} Set up MongoDB using the README instructions, then refresh.`); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadAssignments(); }, []);
  async function saveAssignment(form) {
    setSaving(true);
    try {
      const result = await request(dialog?.item ? `/api/assignments/${dialog.item._id}` : '/api/assignments', { method: dialog?.item ? 'PATCH' : 'POST', body: JSON.stringify(form) });
      setAssignments(current => dialog?.item ? current.map(item => item._id === result._id ? result : item).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)) : [...current, result].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)));
    } finally { setSaving(false); }
  }
  async function toggleComplete(item) {
    try { const result = await request(`/api/assignments/${item._id}`, { method: 'PATCH', body: JSON.stringify({ completed: !item.completed }) }); setAssignments(current => current.map(row => row._id === result._id ? result : row)); }
    catch (error) { setNotice(error.message); }
  }
  async function deleteAssignment(item) {
    if (!window.confirm(`Delete “${item.title}”? This can’t be undone.`)) return;
    try { await request(`/api/assignments/${item._id}`, { method: 'DELETE' }); setAssignments(current => current.filter(row => row._id !== item._id)); }
    catch (error) { setNotice(error.message); }
  }
  const visibleAssignments = useMemo(() => assignments.filter(item => {
    const matchesFilter = filter === 'All work' || (filter === 'To do' ? !item.completed : item.completed);
    const text = `${item.title} ${item.course}`.toLowerCase();
    return matchesFilter && text.includes(query.trim().toLowerCase());
  }), [assignments, filter, query]);
  const openCount = assignments.filter(item => !item.completed).length;
  const completedCount = assignments.length - openCount;
  const dueSoon = assignments.filter(item => { const days = (new Date(item.dueDate) - new Date()) / 86400000; return !item.completed && days >= 0 && days <= 7; }).length;
  const greeting = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="#top"><span className="brand-mark"><Icon name="book" size={19} /></span><span>study<span className="brand-light">sprint</span></span></a>
      <div className="side-label">YOUR SPACE</div><nav className="side-nav"><button className="nav-item active"><span className="nav-icon"><Icon name="book" /></span>My assignments<span className="nav-count">{openCount}</span></button></nav>
      <div className="side-bottom"><div className="tip-card"><span className="tip-icon"><Icon name="spark" /></span><p className="tip-title">Small steps add up.</p><p className="tip-copy">Pick one thing to focus on today. You’ve got this.</p></div><div className="profile"><div className="avatar">S</div><div><strong>Student space</strong><span>One day at a time</span></div><span className="profile-dots">···</span></div></div>
    </aside>
    <main className="main-area" id="top"><header className="topbar"><button className="mobile-brand"><span className="brand-mark"><Icon name="book" size={17} /></span>studysprint</button><div className="top-date"><span className="date-dot" /> YOUR STUDY SPACE <span className="date-divider">/</span> {greeting.toUpperCase()}</div><div className="top-right"><span className="avatar avatar-small">S</span></div></header>
      <div className="content"><section className="hero"><div className="hero-text"><p className="eyebrow">YOUR SPACE TO STAY ON TRACK</p><h1>A little progress,<br /><span>every day.</span></h1><p className="hero-copy">Keep your coursework in one calm place. You bring the effort — we’ll help with the list.</p></div><div className="hero-art" aria-hidden="true"><div className="art-sun"/><div className="art-paper"><div className="paper-top"><span>THIS WEEK</span><span className="paper-star">✳</span></div><div className="paper-line wide"/><div className="paper-line"/><div className="paper-check"><span>✓</span><i/><b/></div><div className="paper-check"><span>✓</span><i/><b/></div><div className="paper-check muted"><span/><i/><b/></div><div className="paper-stamp">YOU’RE<br/>DOING GREAT</div></div><span className="art-spark spark-one">✳</span><span className="art-spark spark-two">✦</span></div></section>
        <section className="stats-grid" aria-label="Assignment summary"><div className="stat-card"><span className="stat-icon icon-lilac"><Icon name="book" /></span><div><span className="stat-label">ON YOUR LIST</span><strong>{assignments.length}</strong><span className="stat-caption">assignments total</span></div></div><div className="stat-card"><span className="stat-icon icon-peach"><Icon name="calendar" /></span><div><span className="stat-label">COMING UP</span><strong>{dueSoon}</strong><span className="stat-caption">due in the next 7 days</span></div></div><div className="stat-card"><span className="stat-icon icon-mint"><Icon name="check" /></span><div><span className="stat-label">ALREADY DONE</span><strong>{completedCount}</strong><span className="stat-caption">nice work — keep going</span></div></div></section>
        <section className="work-section"><div className="section-heading"><div><p className="eyebrow">YOUR COURSEWORK</p><h2>My assignments <span className="heading-count">{openCount}</span></h2></div><button className="button button-primary add-button" onClick={() => setDialog({ item: null })}><Icon name="plus" size={17} />Add assignment</button></div>
          <div className="toolbar"><div className="tabs" role="tablist" aria-label="Filter assignments">{['All work', 'To do', 'Completed'].map(tab => <button role="tab" aria-selected={filter === tab} className={`tab ${filter === tab ? 'selected' : ''}`} key={tab} onClick={() => setFilter(tab)}>{tab}{tab === 'To do' && <span className="tab-badge">{openCount}</span>}</button>)}</div><label className="search-box"><span className="search-glass"/><input aria-label="Search assignments" placeholder="Search your list" value={query} onChange={event => setQuery(event.target.value)} /><kbd>⌘ K</kbd></label></div>
          {notice && <div className="notice" role="alert"><span>{notice}</span><button onClick={loadAssignments}>Retry</button></div>}
          <div className="assignment-list">{loading ? <div className="empty-state"><div className="loader"/><p>Getting your list ready…</p></div> : visibleAssignments.length ? visibleAssignments.map((item, index) => {
            const due = relativeDue(item.dueDate, item.completed); const overdue = !item.completed && due.includes('overdue');
            return <article className={`assignment-row ${item.completed ? 'is-complete' : ''}`} key={item._id} style={{ '--row-index': index }}><button className={`complete-toggle ${item.completed ? 'checked' : ''}`} onClick={() => toggleComplete(item)} aria-label={item.completed ? 'Mark as to do' : 'Mark as complete'}>{item.completed && <Icon name="check" size={14} />}</button><button className="assignment-main" onClick={() => setDialog({ item })}><span className="assignment-title">{item.title}</span><span className="assignment-course">{item.course}</span></button><span className={`priority priority-${item.priority.toLowerCase()}`}><i/>{item.priority}</span><span className={`due-label ${overdue ? 'overdue' : ''}`}><Icon name="calendar" size={15}/>{due}</span><button className="row-action" onClick={() => setDialog({ item })} aria-label={`Edit ${item.title}`}><Icon name="arrow" size={16}/></button><button className="row-action delete-action" onClick={() => deleteAssignment(item)} aria-label={`Delete ${item.title}`}><Icon name="trash" size={16}/></button></article>;
          }) : <div className="empty-state"><div className="empty-illustration"><Icon name="book" size={25}/><span>✳</span></div><h3>{query ? 'No matches just yet' : filter === 'Completed' ? 'Your wins will show up here' : 'A clear desk, a fresh start.'}</h3><p>{query ? 'Try another search term.' : filter === 'Completed' ? 'Complete an assignment and it’ll land here.' : 'Add your first assignment and make a plan that feels manageable.'}</p>{!query && filter !== 'Completed' && <button className="button button-primary" onClick={() => setDialog({ item: null })}><Icon name="plus" size={16}/>Add your first assignment</button>}</div>}</div>
          <div className="list-footer"><span>Showing <strong>{visibleAssignments.length}</strong> of <strong>{assignments.length}</strong> assignments</span><span className="footer-note"><span className="footer-spark">✳</span> One step at a time</span></div>
        </section><footer className="page-footer">Made for the work you’re proud of <span>✳</span></footer>
      </div>
    </main>
    {dialog && <AssignmentForm key={dialog.item?._id || 'new'} initial={dialog.item ? { title: dialog.item.title, course: dialog.item.course, dueDate: dialog.item.dueDate.slice(0, 10), priority: dialog.item.priority } : null} onClose={() => setDialog(null)} onSave={saveAssignment} saving={saving}/>}
  </div>;
}
