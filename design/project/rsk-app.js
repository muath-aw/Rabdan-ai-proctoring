/* Exam Integrity Console — RSK composition (plain JS, React.createElement).
   Reads window.React, window.RSK, window.ReactTable at render time. */
(function () {
  const React = window.React;
  const h = React.createElement;
  const { useState, useMemo, useEffect, useRef } = React;

  // ---------------------------------------------------------------- icons
  function svg(children, size, extra) {
    return h('svg', Object.assign({ width: size || 16, height: size || 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }, extra || {}), children);
  }
  const P = (d) => h('path', { d, key: d });
  const Icon = {
    users: (s) => svg([P('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'), h('circle', { key: 'c', cx: 9, cy: 7, r: 4 }), P('M22 21v-2a4 4 0 0 0-3-3.87'), P('M16 3.13a4 4 0 0 1 0 7.75')], s),
    help: (s) => svg([h('circle', { key: 'c', cx: 12, cy: 12, r: 10 }), P('M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'), P('M12 17h.01')], s),
    check: (s) => svg([P('M20 6 9 17l-5-5')], s, { strokeWidth: 2.4 }),
    x: (s) => svg([P('M18 6 6 18'), P('m6 6 12 12')], s),
    rotate: (s) => svg([P('M3 2v6h6'), P('M3 13a9 9 0 1 0 3-7.7L3 8')], s),
    dots: (s) => svg([h('circle', { key: 1, cx: 12, cy: 12, r: 1 }), h('circle', { key: 2, cx: 12, cy: 5, r: 1 }), h('circle', { key: 3, cx: 12, cy: 19, r: 1 })], s),
    download: (s) => svg([P('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'), P('M7 10l5 5 5-5'), P('M12 15V3')], s),
    file: (s) => svg([P('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'), P('M14 2v6h6'), P('M9 15h6'), P('M9 11h2')], s),
    bell: (s) => svg([P('M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'), P('M10.3 21a1.94 1.94 0 0 0 3.4 0')], s),
    search: (s) => svg([h('circle', { key: 'c', cx: 11, cy: 11, r: 8 }), P('m21 21-4.3-4.3')], s),
    chevronLeft: (s) => svg([P('m15 18-6-6 6-6')], s),
    chevronRight: (s) => svg([P('m9 18 6-6-6-6')], s),
    camera: (s) => svg([P('M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z'), h('circle', { key: 'c', cx: 12, cy: 13, r: 3 })], s),
    alert: (s) => svg([P('M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'), P('M12 9v4'), P('M12 17h.01')], s),
    lock: (s) => svg([h('rect', { key: 'r', x: 3, y: 11, width: 18, height: 11, rx: 2 }), P('M7 11V7a5 5 0 0 1 10 0v4')], s),
  };

  // ---------------------------------------------------------------- domain
  const STATUS = {
    open: { label: 'Open', badge: 'warning', dot: 'var(--warning)' },
    confirmed: { label: 'Confirmed', badge: 'success', dot: 'var(--success)' },
    discarded: { label: 'Discarded', badge: 'muted', dot: 'var(--muted-400)' },
  };
  const TYPE = {
    phone: { label: 'Phone detected' },
    adjacent: { label: 'Adjacent students' },
  };

  function seedIncidents() {
    return [
      { id: 'INC-04817', type: 'phone', time: '09:42:18', cam: 'cam-04', subjects: ['Maya Olsen'], conf: 0.94, status: 'open' },
      { id: 'INC-04815', type: 'adjacent', time: '09:41:02', cam: 'cam-02', subjects: [null, null], conf: 0.81, status: 'open' },
      { id: 'INC-04812', type: 'phone', time: '09:39:47', cam: 'cam-04', subjects: ['Daniel Reyes'], conf: 0.88, status: 'open' },
      { id: 'INC-04808', type: 'adjacent', time: '09:37:30', cam: 'cam-06', subjects: ['Priya Anand', 'Marcus Webb'], conf: null, status: 'confirmed' },
      { id: 'INC-04802', type: 'phone', time: '09:35:11', cam: 'cam-01', subjects: [null], conf: 0.69, status: 'open' },
      { id: 'INC-04798', type: 'phone', time: '09:33:50', cam: 'cam-03', subjects: ['Liang Wu'], conf: 0.91, status: 'confirmed' },
      { id: 'INC-04791', type: 'adjacent', time: '09:30:22', cam: 'cam-02', subjects: ['Hana Sato', null], conf: null, status: 'discarded' },
      { id: 'INC-04785', type: 'phone', time: '09:28:05', cam: 'cam-05', subjects: ['Sara Kim'], conf: 0.85, status: 'discarded' },
      { id: 'INC-04779', type: 'adjacent', time: '09:25:40', cam: 'cam-06', subjects: ['Noah Pratt', 'Ava Lindqvist'], conf: 0.79, status: 'open' },
      { id: 'INC-04772', type: 'phone', time: '09:22:14', cam: 'cam-01', subjects: ['Owen Diaz'], conf: 0.63, status: 'open' },
      { id: 'INC-04766', type: 'adjacent', time: '09:19:03', cam: 'cam-03', subjects: ['Ivy Barnes', 'Leo Farrow'], conf: 0.86, status: 'confirmed' },
    ];
  }

  const pct = (c) => (c == null ? '—' : Math.round(c * 100) + '%');
  const subjectsText = (subs) => subs.map((s) => s || 'Unidentified').join('  ·  ');

  // ---------------------------------------------------------------- shared cells
  function StatusBadge(status) {
    const { Badge } = window.RSK;
    const s = STATUS[status];
    return h(Badge, { variant: s.badge, size: 'sm' }, s.label);
  }

  function TypeChip(type) {
    const { Badge } = window.RSK;
    return h(Badge, { variant: 'neutral', size: 'sm' }, TYPE[type].label);
  }

  function Thumbnail(cam) {
    return h('div', {
      className: 'relative shrink-0 overflow-hidden rounded-md border border-border',
      style: { width: 60, height: 40, backgroundImage: 'repeating-linear-gradient(45deg,#EFEEEC,#EFEEEC 6px,#E5E2DC 6px,#E5E2DC 12px)' },
    },
      h('span', { className: 'text-muted-400 absolute rounded px-1', style: { fontSize: 9, fontFamily: 'ui-monospace,monospace', background: 'var(--background)', left: 5, bottom: 4 } }, cam)
    );
  }

  function SubjectsCell(subjects) {
    const isPair = subjects.length > 1;
    return h('div', { className: 'flex items-center gap-2', style: { whiteSpace: 'normal' } },
      isPair ? h('span', { className: 'text-muted-400 shrink-0' }, Icon.users(15)) : null,
      h('div', { className: 'flex min-w-0 flex-col gap-1' },
        subjects.map((s, i) => s
          ? h('span', { key: i, className: 'text-foreground text-sm font-medium', style: { lineHeight: 1.15 } }, s)
          : h('span', { key: i, className: 'text-warning inline-flex w-fit items-center gap-1 rounded bg-warning-200 px-1.5 py-0.5', style: { fontSize: 12, fontWeight: 500 } }, Icon.help(12), 'Unidentified')
        )
      )
    );
  }

  function ConfidenceCell(conf) {
    if (conf == null) return h('span', { className: 'text-muted-400 text-sm' }, '—');
    const low = conf < 0.7;
    return h('div', { className: 'flex flex-col gap-1', style: { whiteSpace: 'normal' } },
      h('span', { className: (low ? 'text-warning ' : 'text-foreground ') + 'text-sm font-semibold', style: { fontFamily: 'ui-monospace,monospace' } }, pct(conf)),
      h('div', { className: 'overflow-hidden rounded-full bg-muted-100', style: { height: 5, width: 60 } },
        h('div', { className: low ? 'h-full rounded-full bg-warning' : 'h-full rounded-full bg-primary', style: { width: Math.round(conf * 100) + '%' } })
      )
    );
  }

  // ---------------------------------------------------------------- columns
  function makeColumns(handlers, mode) {
    const { Checkbox, Button, DropdownMenu } = window.RSK;
    const selectArrayFilter = (row, id, val) => !val || !val.length || val.includes(row.getValue(id));

    return [
      {
        id: 'select', size: 44, enableSorting: false, enableGlobalFilter: false,
        meta: { disableRowClick: true },
        header: ({ table }) => h(Checkbox, {
          'aria-label': 'Select all',
          checked: table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? 'indeterminate' : false,
          onCheckedChange: (v) => table.toggleAllPageRowsSelected(!!v),
        }),
        cell: ({ row }) => h(Checkbox, {
          'aria-label': 'Select row',
          checked: row.getIsSelected(),
          onCheckedChange: (v) => row.toggleSelected(!!v),
        }),
      },
      {
        id: 'thumb', header: '', size: 76, enableSorting: false, enableGlobalFilter: false,
        cell: ({ row }) => Thumbnail(row.original.cam),
      },
      {
        accessorKey: 'type', header: 'Type', size: 210, enableGlobalFilter: false,
        filterFn: selectArrayFilter,
        meta: { filterMeta: { variant: 'select', label: 'Type', options: [{ value: 'phone', label: 'Phone detected' }, { value: 'adjacent', label: 'Adjacent students' }], getOptionValue: (o) => o.value, getOptionLabel: (o) => o.label } },
        cell: ({ row }) => TypeChip(row.original.type),
      },
      {
        accessorKey: 'id', header: 'Incident', size: 150, enableGlobalFilter: true,
        cell: ({ row }) => h('div', { className: 'flex flex-col gap-0.5', style: { whiteSpace: 'normal' } },
          h('span', { className: 'text-foreground text-sm font-medium', style: { fontFamily: 'ui-monospace,monospace' } }, row.original.id),
          h('span', { className: 'text-muted-400', style: { fontSize: 11, fontFamily: 'ui-monospace,monospace' } }, row.original.time)
        ),
      },
      {
        id: 'subjects', accessorFn: (r) => r.subjects, header: 'Student(s)', size: 240, enableSorting: false, enableGlobalFilter: false,
        filterFn: (row, id, val) => {
          if (!val || !val.length) return true;
          const subs = row.original.subjects;
          const hasId = subs.some(Boolean), hasUn = subs.some((s) => !s);
          return val.some((v) => (v === 'identified' ? hasId : v === 'unidentified' ? hasUn : false));
        },
        meta: { filterMeta: { variant: 'select', label: 'Students', options: [{ value: 'identified', label: 'Identified' }, { value: 'unidentified', label: 'Unidentified' }], getOptionValue: (o) => o.value, getOptionLabel: (o) => o.label } },
        cell: ({ row }) => SubjectsCell(row.original.subjects),
      },
      {
        accessorKey: 'conf', header: 'Confidence', size: 110, enableSorting: true, enableGlobalFilter: false, sortDescFirst: true,
        cell: ({ row }) => ConfidenceCell(row.original.conf),
      },
      {
        accessorKey: 'status', header: 'Status', size: 130, enableGlobalFilter: false,
        filterFn: selectArrayFilter,
        meta: { filterMeta: { variant: 'select', label: 'Status', options: [{ value: 'open', label: 'Open' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'discarded', label: 'Discarded' }], getOptionValue: (o) => o.value, getOptionLabel: (o) => o.label } },
        cell: ({ row }) => StatusBadge(row.original.status),
      },
      {
        id: 'actions', header: '', size: 56, enableSorting: false, enableGlobalFilter: false,
        meta: { disableRowClick: true },
        cell: ({ row }) => {
          const r = row.original;
          const items = [];
          if (r.status === 'open') {
            items.push(h(DropdownMenu.Item, { key: 'confirm', onSelect: () => handlers.onConfirm(r.id) }, Icon.check(14), 'Confirm violation'));
            items.push(h(DropdownMenu.Item, { key: 'disc', onSelect: () => handlers.onDiscard(r.id) }, Icon.x(14), 'Discard'));
          } else if (r.status === 'confirmed') {
            items.push(h(DropdownMenu.Item, { key: 'reopen', onSelect: () => handlers.onReopen(r.id) }, Icon.rotate(14), 'Reopen'));
            items.push(h(DropdownMenu.Item, { key: 'disc', onSelect: () => handlers.onDiscard(r.id) }, Icon.x(14), 'Discard'));
          } else {
            items.push(h(DropdownMenu.Item, { key: 'restore', onSelect: () => handlers.onRestore(r.id) }, Icon.rotate(14), 'Restore to open'));
          }
          items.push(h(DropdownMenu.Separator, { key: 'sep' }));
          items.push(h(DropdownMenu.Item, { key: 'review', onSelect: () => handlers.onReview(r.id) }, Icon.search(14), 'Review incident'));
          items.push(h(DropdownMenu.Item, { key: 'proof', onSelect: () => handlers.onProof(r.id) }, Icon.file(14), 'Export PDF proof'));
          return h('div', { className: 'flex items-center justify-end' },
            h(DropdownMenu, null,
              h(DropdownMenu.Trigger, { asChild: true }, h(Button, { variant: 'ghost', size: 'icon-sm', 'aria-label': 'Row actions' }, Icon.dots(16))),
              h(DropdownMenu.Content, { align: 'end' }, items)
            )
          );
        },
      },
    ];
  }

  // ---------------------------------------------------------------- detail dialog
  function DetailDialog(props) {
    const { Dialog, Button, Badge } = window.RSK;
    const inc = props.incident;
    const open = !!inc;
    const body = inc ? (function () {
      const s = STATUS[inc.status];
      const low = inc.conf != null && inc.conf < 0.7;
      return [
        h('div', { key: 'still', className: 'relative overflow-hidden rounded-xl border border-border', style: { height: 220, backgroundImage: 'repeating-linear-gradient(45deg,#EFEEEC,#EFEEEC 9px,#E5E2DC 9px,#E5E2DC 18px)' } },
          h('div', { className: 'absolute', style: { left: 12, top: 12 } }, TypeChip(inc.type)),
          h('div', { className: 'text-muted-foreground absolute flex items-center gap-2 rounded px-2 py-1', style: { fontSize: 11, fontFamily: 'ui-monospace,monospace', background: 'var(--background)', left: 12, bottom: 12 } }, inc.cam, h('span', { className: 'text-muted-300' }, '·'), inc.time)
        ),
        h('div', { key: 'st', className: 'mt-4 flex items-center justify-between' },
          h('span', { className: 'text-muted-400 text-xs font-semibold uppercase', style: { letterSpacing: '.06em' } }, 'Status'), StatusBadge(inc.status)),
        h('div', { key: 'sub', className: 'mt-4' },
          h('div', { className: 'text-muted-400 mb-2 text-xs font-semibold uppercase', style: { letterSpacing: '.06em' } }, inc.subjects.length > 1 ? 'Subjects · adjacent pair' : 'Subject'),
          SubjectsCell(inc.subjects)
        ),
        inc.conf != null ? h('div', { key: 'conf', className: 'mt-4' },
          h('div', { className: 'text-muted-400 mb-2 text-xs font-semibold uppercase', style: { letterSpacing: '.06em' } }, 'Detection confidence'),
          h('div', { className: 'flex items-center gap-3' },
            h('span', { className: (low ? 'text-warning ' : 'text-foreground ') + 'text-2xl font-semibold', style: { fontFamily: 'ui-monospace,monospace' } }, pct(inc.conf)),
            h('div', { className: 'flex-1 overflow-hidden rounded-full bg-muted-100', style: { height: 6 } },
              h('div', { className: low ? 'h-full rounded-full bg-warning' : 'h-full rounded-full bg-primary', style: { width: Math.round(inc.conf * 100) + '%' } }))
          )
        ) : null,
        h('div', { key: 'meta', className: 'mt-4 grid grid-cols-2 gap-4 rounded-xl bg-muted-50 p-4' },
          metaItem('Violation', TYPE[inc.type].label),
          metaItem('Source camera', inc.cam, true),
          metaItem('Timestamp', inc.time, true),
          metaItem('Incident ID', inc.id, true)
        ),
      ];
    })() : null;

    function metaItem(label, value, mono) {
      return h('div', { key: label },
        h('div', { className: 'text-muted-400 mb-1 text-xs font-semibold uppercase', style: { letterSpacing: '.06em' } }, label),
        h('div', { className: 'text-foreground text-sm', style: mono ? { fontFamily: 'ui-monospace,monospace' } : null }, value));
    }

    const footer = inc ? h(Dialog.Footer, { className: 'flex flex-col gap-2' },
      inc.status === 'open' ? h('div', { className: 'flex gap-2' },
        h(Button, { variant: 'success', className: 'flex-1', onClick: () => props.onConfirm(inc.id) }, Icon.check(15), 'Confirm violation'),
        h(Button, { variant: 'outline-muted', className: 'flex-1', onClick: () => props.onDiscard(inc.id) }, 'Discard')
      ) : null,
      inc.status === 'confirmed' ? h(Button, { variant: 'outline-muted', onClick: () => props.onDiscard(inc.id) }, 'Discard instead') : null,
      inc.status === 'discarded' ? h(Button, { variant: 'outline-muted', onClick: () => props.onRestore(inc.id) }, Icon.rotate(14), 'Restore to open') : null,
      h(Button, { variant: 'outline', onClick: () => props.onProof(inc.id) }, Icon.file(15), 'Export as PDF proof')
    ) : null;

    return h(Dialog, { open: open, onOpenChange: (o) => { if (!o) props.onClose(); } },
      inc ? h(Dialog.Panel, { className: 'max-w-md' },
        h(Dialog.Header, null,
          h('div', { className: 'flex items-center gap-3' }, h(Dialog.Title, null, 'Incident review'),
            h('span', { className: 'text-muted-400 text-xs', style: { fontFamily: 'ui-monospace,monospace' } }, inc.id)),
          h(Dialog.Description, { className: 'mt-1', style: { fontFamily: 'ui-monospace,monospace' } }, inc.cam + ' · ' + inc.time)
        ),
        h(Dialog.Content, { className: 'max-h-[62vh] overflow-y-auto' }, body),
        footer
      ) : h('span')
    );
  }

  // ---------------------------------------------------------------- export dialog
  function ExportDialog(props) {
    const { Dialog, Button, Table } = window.RSK;
    const items = props.items || [];
    const open = props.open;
    return h(Dialog, { open: open, onOpenChange: (o) => { if (!o) props.onClose(); } },
      open ? h(Dialog.Panel, { className: 'max-w-2xl' },
        h(Dialog.Header, null,
          h(Dialog.Title, null, 'Export evidence'),
          h(Dialog.Description, { className: 'mt-1' }, props.subtitle)
        ),
        h(Dialog.Content, { className: 'max-h-[62vh] overflow-y-auto' },
          h('div', { className: 'mb-3 flex items-center gap-2 text-muted-foreground', style: { fontSize: 12 } }, Icon.help(14), 'Statuses appear as labels in the exported table.'),
          h('div', { className: 'overflow-hidden rounded-xl border border-border' },
            h(Table, null,
              h(Table.Header, null, h(Table.Row, null,
                h(Table.Head, null, 'Type'), h(Table.Head, null, 'Time'), h(Table.Head, null, 'Student(s)'), h(Table.Head, null, 'Status'))),
              h(Table.Body, null, items.map((r) => h(Table.Row, { key: r.id },
                h(Table.Cell, null, TYPE[r.type].label),
                h(Table.Cell, { style: { fontFamily: 'ui-monospace,monospace' } }, r.time),
                h(Table.Cell, null, subjectsText(r.subjects)),
                h(Table.Cell, null, StatusBadge(r.status))
              )))
            )
          )
        ),
        h(Dialog.Footer, { className: 'flex items-center justify-between' },
          h('span', { className: 'text-muted-foreground text-sm' }, items.length + ' incident' + (items.length === 1 ? '' : 's') + ' · evidence package'),
          h('div', { className: 'flex gap-2' },
            h(Button, { variant: 'outline-muted', onClick: props.onClose }, 'Cancel'),
            h(Button, { variant: 'default', onClick: props.onExport }, Icon.download(15), 'Export violations table'))
        )
      ) : h('span')
    );
  }

  // ---------------------------------------------------------------- toast
  function Toast(msg) {
    const { Alert } = window.RSK;
    if (!msg) return null;
    return h('div', { className: 'fixed z-[60]', style: { right: 24, bottom: 24, maxWidth: 360 } },
      h(Alert, { variant: 'success', className: 'flex items-center gap-2 shadow' }, Icon.check(16), h(Alert.Title, null, msg)));
  }

  // ---------------------------------------------------------------- top bar
  function TopBar(right) {
    return h('div', { className: 'bg-background border-border border-b' },
      h('div', { className: 'mx-auto flex items-center justify-between px-6', style: { maxWidth: 1200, height: 60 } },
        h('div', { className: 'flex items-center gap-3' },
          h('a', { href: 'Exam List.dc.html', className: 'text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-md px-2 py-1 text-sm' }, Icon.chevronLeft(15), 'Exams'),
          h('span', { className: 'text-muted-300' }, '/'),
          h('div', { className: 'flex items-center gap-2' },
            h('div', { className: 'bg-primary text-primary-foreground flex items-center justify-center rounded-md font-semibold', style: { width: 26, height: 26, fontSize: 12 } }, 'C'),
            h('span', { className: 'text-foreground text-sm font-semibold' }, 'Calculus II · Final'))
        ),
        right
      )
    );
  }

  // ---------------------------------------------------------------- exam header
  function ExamHeader(mode, openCount, onExportEvidence) {
    const { Badge, Button } = window.RSK;
    const live = mode === 'active';
    return h('div', { className: 'bg-background border-border flex items-center justify-between gap-6 rounded-2xl border p-6 shadow' },
      h('div', { className: 'min-w-0 flex-1' },
        h('div', { className: 'mb-2 flex items-center gap-3' },
          h('h1', { className: 'text-foreground text-xl font-semibold', style: { whiteSpace: 'nowrap' } }, 'Calculus II · Final'),
          live
            ? h(Badge, { variant: 'destructive', size: 'sm' }, h('span', { className: 'inline-block rounded-full bg-current', style: { width: 6, height: 6, marginRight: 6, animation: 'rskpulse 1.6s ease-in-out infinite' } }), 'Live')
            : h(Badge, { variant: 'muted', size: 'sm' }, Icon.lock(11), 'Ended')
        ),
        h('div', { className: 'text-muted-foreground flex items-center gap-2 text-sm', style: { whiteSpace: 'nowrap' } },
          h('span', null, 'Hall B'), h('span', { className: 'text-muted-300' }, '·'),
          h('span', { style: { fontFamily: 'ui-monospace,monospace' } }, '09:00 – 12:00'), h('span', { className: 'text-muted-300' }, '·'),
          h('span', { style: { fontFamily: 'ui-monospace,monospace' } }, live ? 'In session 0:42' : 'Ended 12:04 · Jun 29')
        )
      ),
      h('div', { className: 'flex shrink-0 items-center gap-3' },
        h('div', { className: 'border-border rounded-xl border px-4 py-2 text-center', style: { minWidth: 84 } },
          h('div', { className: 'text-foreground text-xl font-semibold', style: { fontFamily: 'ui-monospace,monospace' } }, '38'),
          h('div', { className: 'text-muted-400 mt-0.5 text-xs uppercase', style: { letterSpacing: '.05em' } }, 'Students')),
        h('div', { className: 'rounded-xl border px-4 py-2 text-center', style: { minWidth: 84, background: 'var(--warning-200)', borderColor: 'var(--warning-200)' } },
          h('div', { className: 'text-warning text-xl font-semibold', style: { fontFamily: 'ui-monospace,monospace' } }, String(openCount)),
          h('div', { className: 'text-warning mt-0.5 text-xs uppercase', style: { letterSpacing: '.05em', opacity: 0.8 } }, 'Open'))
      )
    );
  }

  // ---------------------------------------------------------------- workspace
  function WorkspaceInner(props) {
    const mode = props.mode;
    const RSK = window.RSK, RT = window.ReactTable;
    const { DataTable, Button, Alert, BlankSlate } = RSK;

    const [incidents, setIncidents] = useState(seedIncidents);
    const [rowSelection, setRowSelection] = useState({});
    const [columnFilters, setColumnFilters] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState([]);
    const [detailId, setDetailId] = useState(null);
    const [exportState, setExportState] = useState({ open: false, scope: 'selection' });
    const [toast, setToast] = useState('');
    const toastRef = useRef(null);

    function flash(msg) { setToast(msg); clearTimeout(toastRef.current); toastRef.current = setTimeout(() => setToast(''), 2600); }
    function setStatus(id, status) { setIncidents((xs) => xs.map((x) => (x.id === id ? Object.assign({}, x, { status: status }) : x))); }

    const handlers = {
      onConfirm: (id) => setStatus(id, 'confirmed'),
      onDiscard: (id) => setStatus(id, 'discarded'),
      onRestore: (id) => setStatus(id, 'open'),
      onReopen: (id) => setStatus(id, 'open'),
      onReview: (id) => setDetailId(id),
      onProof: (id) => flash('Exported ' + id + ' as PDF proof'),
    };

    const columns = useMemo(() => makeColumns(handlers, mode), [mode]);

    const table = RT.useReactTable({
      data: incidents,
      columns: columns,
      state: { rowSelection: rowSelection, columnFilters: columnFilters, globalFilter: globalFilter, sorting: sorting },
      enableRowSelection: true,
      enableGlobalFilter: true,
      globalFilterFn: (row, _colId, value) => {
        if (!value) return true;
        const r = row.original;
        const hay = (r.id + ' ' + TYPE[r.type].label + ' ' + r.subjects.map((s) => s || 'unidentified').join(' ')).toLowerCase();
        return hay.indexOf(String(value).toLowerCase()) !== -1;
      },
      onRowSelectionChange: setRowSelection,
      onColumnFiltersChange: setColumnFilters,
      onGlobalFilterChange: setGlobalFilter,
      onSortingChange: setSorting,
      getCoreRowModel: RT.getCoreRowModel(),
      getFilteredRowModel: RT.getFilteredRowModel(),
      getSortedRowModel: RT.getSortedRowModel(),
      getPaginationRowModel: RT.getPaginationRowModel(),
      getFacetedRowModel: RT.getFacetedRowModel(),
      getFacetedUniqueValues: RT.getFacetedUniqueValues(),
      initialState: { pagination: { pageSize: 8 } },
    });

    const openCount = incidents.filter((x) => x.status === 'open').length;
    const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
    const detail = detailId ? incidents.find((x) => x.id === detailId) : null;

    const confirmedItems = incidents.filter((x) => x.status === 'confirmed');
    const exportItems = exportState.scope === 'evidence' ? confirmedItems : selectedRows;
    const exportSubtitle = exportState.scope === 'evidence'
      ? 'All ' + exportItems.length + ' confirmed violation' + (exportItems.length === 1 ? '' : 's') + ' · Calculus II · Final'
      : exportItems.length + ' incident' + (exportItems.length === 1 ? '' : 's') + ' selected · Calculus II · Final';

    function openEvidence() {
      if (confirmedItems.length === 0) { flash('No confirmed violations to export yet'); return; }
      setExportState({ open: true, scope: 'evidence' });
    }
    function openSelection() {
      if (selectedRows.length === 0) return;
      setExportState({ open: true, scope: 'selection' });
    }
    function doExport() {
      flash('Exported violations table · ' + exportItems.length + ' rows');
      setExportState({ open: false, scope: exportState.scope });
    }
    function bulk(status) {
      selectedRows.forEach((r) => setStatus(r.id, status));
      flash(selectedRows.length + ' incidents ' + (status === 'confirmed' ? 'confirmed' : 'discarded'));
      setRowSelection({});
    }

    const topRight = h('div', { className: 'text-muted-foreground flex items-center gap-2 text-sm' },
      mode === 'active'
        ? [h('span', { key: 'd', className: 'inline-block rounded-full bg-success', style: { width: 7, height: 7 } }), 'Synced · live']
        : [Icon.lock(13), 'Records final']
    );

    const bulkBar = selectedRows.length > 0 ? h('div', { className: 'flex items-center justify-between gap-4 rounded-xl px-4 py-2.5', style: { background: 'var(--foreground)', color: 'var(--background)' } },
      h('span', { className: 'text-sm font-medium' }, selectedRows.length + ' selected'),
      h('div', { className: 'flex items-center gap-2' },
        h(Button, { variant: 'success', size: 'sm', onClick: () => bulk('confirmed') }, Icon.check(14), 'Confirm'),
        h(Button, { variant: 'outline-muted', size: 'sm', onClick: () => bulk('discarded') }, 'Discard'),
        h(Button, { variant: 'default', size: 'sm', onClick: openSelection }, Icon.download(14), 'Export selected'),
        h(Button, { variant: 'ghost', size: 'sm', onClick: () => setRowSelection({}), style: { color: 'var(--background)' } }, 'Clear')
      )
    ) : null;

    const stillOpen = (mode === 'past' && openCount > 0) ? h(Alert, { variant: 'warning', className: 'flex items-start gap-3' },
      h('span', { className: 'text-warning mt-0.5 shrink-0' }, Icon.alert(18)),
      h('div', { className: 'flex-1' },
        h(Alert.Title, null, openCount + (openCount === 1 ? ' incident still needs review' : ' incidents still need review')),
        h(Alert.Description, null, 'These remained Open when the exam ended. They are still fully triageable here.')),
      h(Button, { variant: 'outline', size: 'sm', onClick: () => setColumnFilters([{ id: 'status', value: ['open'] }]) }, 'Review open')
    ) : null;

    const emptyState = { title: 'No incidents match the current filters', description: 'Adjust the search or filters above.' };

    return h('div', { className: 'bg-canvas', style: { height: '100vh', display: 'flex', flexDirection: 'column' } },
      TopBar(topRight),
      h('div', { className: 'mx-auto flex min-h-0 w-full flex-1 flex-col gap-4 px-6 pt-6 pb-6', style: { maxWidth: 1200 } },
        ExamHeader(mode, openCount, openEvidence),
        stillOpen,
        bulkBar,
        h('div', { className: 'min-h-0 flex-1' },
          h(DataTable, { table: table, onRowClick: (row) => setDetailId(row.original.id), getRowClassName: (row) => (row.original.status === 'discarded' ? 'opacity-60' : undefined) },
            h(DataTable.Toolbar, { totalCount: incidents.length, totalLabel: 'incidents', placeholder: 'Search ID, student, or type…' }),
            h(DataTable.Content, { emptyState: emptyState }),
            h(DataTable.Pagination, { pageSizeOptions: [8, 15, 30] })
          )
        )
      ),
      h(DetailDialog, { incident: detail, onClose: () => setDetailId(null), onConfirm: (id) => { handlers.onConfirm(id); }, onDiscard: (id) => { handlers.onDiscard(id); }, onRestore: (id) => { handlers.onRestore(id); }, onProof: handlers.onProof }),
      h(ExportDialog, { open: exportState.open, items: exportItems, subtitle: exportSubtitle, onClose: () => setExportState({ open: false, scope: exportState.scope }), onExport: doExport }),
      Toast(toast)
    );
  }

  function Workspace(mode) {
    const { DsPreviewProvider } = window.RSK;
    return h(DsPreviewProvider, null, h(WorkspaceInner, { mode: mode }));
  }

  // ---------------------------------------------------------------- exam list
  function ExamListInner() {
    const RSK = window.RSK;
    const { Tabs, Badge, Button, Input, Select, Card } = RSK;
    const [tab, setTab] = useState('active');
    const [search, setSearch] = useState('');
    const [range, setRange] = useState('all');
    const [sort, setSort] = useState('recent');
    const [syncing, setSyncing] = useState(false);
    const [syncedAt, setSyncedAt] = useState('2 min ago');
    const syncTimer = useRef(null);
    function doSync() {
      if (syncing) return;
      setSyncing(true);
      clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(function () { setSyncing(false); setSyncedAt('just now'); }, 1100);
    }

    const active = [
      { letter: 'C', title: 'Calculus II · Final', room: 'Hall B', when: '09:00 – 12:00', live: true, total: 7, open: 5, ts: 900, href: 'Active Exam Workspace.dc.html' },
      { letter: 'O', title: 'Organic Chemistry · Midterm', room: 'Lab 2', when: '09:30 – 11:30', live: true, total: 2, open: 0, ts: 930, href: 'Active Exam Workspace.dc.html' },
    ];
    const past = [
      { letter: 'L', title: 'Linear Algebra · Final', room: 'Hall A', when: 'Jun 28, 2026', total: 3, open: 1, ts: 20260628, href: 'Past Exam Workspace.dc.html' },
      { letter: 'W', title: 'World History · Midterm', room: 'Room 110', when: 'Jun 27, 2026', total: 0, open: 0, ts: 20260627, href: 'Past Exam Workspace.dc.html' },
      { letter: 'M', title: 'Microeconomics · Final', room: 'Hall B', when: 'Jun 26, 2026', total: 5, open: 0, ts: 20260626, href: 'Past Exam Workspace.dc.html' },
    ];
    const isPast = tab === 'past';
    let list = isPast ? past.slice() : active.slice();
    if (isPast) {
      const q = search.trim().toLowerCase();
      if (q) list = list.filter((e) => (e.title + ' ' + e.room).toLowerCase().indexOf(q) !== -1);
      if (range !== 'all') { const cutoff = range === '7' ? 20260622 : 20260530; list = list.filter((e) => e.ts >= cutoff); }
      list.sort((a, b) => (sort === 'oldest' ? a.ts - b.ts : sort === 'incidents' ? b.total - a.total : b.ts - a.ts));
    } else {
      list.sort((a, b) => a.ts - b.ts);
    }

    function ExamRow(e) {
      return h('a', { key: e.title, href: e.href, className: 'block no-underline' },
        h('div', { className: 'bg-background border-border hover:shadow flex items-center gap-4 rounded-2xl border p-4 shadow-sm transition-shadow' },
          h('div', { className: (e.live ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground') + ' flex shrink-0 items-center justify-center rounded-xl font-semibold', style: { width: 42, height: 42, fontSize: 16 } }, e.letter),
          h('div', { className: 'min-w-0 flex-1' },
            h('div', { className: 'flex flex-wrap items-center gap-2' },
              h('span', { className: 'text-foreground font-semibold', style: { whiteSpace: 'nowrap' } }, e.title),
              e.live ? h(Badge, { variant: 'destructive', size: 'sm' }, h('span', { className: 'inline-block rounded-full bg-current', style: { width: 6, height: 6, marginRight: 6, animation: 'rskpulse 1.6s ease-in-out infinite' } }), 'Live') : null,
              (!isPast && e.open > 0) ? h(Badge, { variant: 'warning', size: 'sm' }, 'New incidents') : null
            ),
            h('div', { className: 'text-muted-foreground mt-1 flex items-center gap-2 text-sm', style: { whiteSpace: 'nowrap' } },
              h('span', null, e.room), h('span', { className: 'text-muted-300' }, '·'),
              h('span', { style: { fontFamily: 'ui-monospace,monospace' } }, e.when))
          ),
          h('div', { className: 'flex shrink-0 flex-col items-end gap-1', style: { whiteSpace: 'nowrap' } },
            e.open > 0 ? h(Badge, { variant: 'warning', size: 'sm' }, e.open + ' open') : null,
            h('span', { className: 'text-muted-400 text-xs', style: { whiteSpace: 'nowrap' } }, e.total === 0 ? 'No incidents' : (e.open === 0 ? '✓ All ' + e.total + ' reviewed' : e.total + ' total'))
          ),
          h('span', { className: 'text-muted-300 shrink-0' }, Icon.chevronRight(18))
        )
      );
    }

    const notif = h('div', { className: 'relative' },
      h(Button, { variant: 'outline', size: 'icon' }, Icon.bell(17)),
      h('span', { className: 'bg-destructive text-primary-foreground absolute flex items-center justify-center rounded-full', style: { top: -6, right: -6, minWidth: 18, height: 18, fontSize: 11, padding: '0 5px', border: '2px solid var(--canvas)' } }, '5'));

    const right = h('div', { className: 'flex items-center gap-3' },
      h('div', { className: 'text-muted-foreground flex items-center gap-2 text-sm', style: { whiteSpace: 'nowrap' } },
        h('span', { className: 'inline-block rounded-full', style: { width: 7, height: 7, background: syncing ? 'var(--warning)' : 'var(--success)' } }),
        syncing ? 'Syncing…' : ('Synced · ' + syncedAt)),
      h(Button, { variant: 'outline', size: 'sm', onClick: doSync, disabled: syncing },
        h('span', { className: 'inline-flex', style: syncing ? { animation: 'rskspin 0.8s linear infinite' } : null }, Icon.rotate(15)),
        syncing ? 'Syncing…' : 'Sync now'),
      notif);

    const selCls = 'min-w-[150px]';

    return h('div', { className: 'bg-canvas', style: { minHeight: '100vh' } },
      h('div', { className: 'bg-background border-border border-b' },
        h('div', { className: 'mx-auto flex items-center justify-between px-8', style: { maxWidth: 960, height: 60 } },
          h('div', { className: 'flex items-center gap-3' },
            h('div', { className: 'bg-primary text-primary-foreground flex items-center justify-center rounded-lg font-semibold', style: { width: 30, height: 30 } }, 'P'),
            h('span', { className: 'text-foreground font-semibold' }, 'Proctor'),
            h('span', { className: 'text-muted-400 border-border border-l pl-3 text-xs' }, 'Exam Integrity Console')),
          right)
      ),
      h('div', { className: 'mx-auto px-8 pb-24 pt-10', style: { maxWidth: 960 } },
        h('h1', { className: 'text-foreground text-2xl font-semibold' }, 'Exams'),
        h('p', { className: 'text-muted-foreground mt-1 text-sm' }, 'Monitor live sessions and review captured incidents.'),
        h(Tabs, { value: tab, onValueChange: setTab, className: 'mt-6' },
          h(Tabs.List, null,
            h(Tabs.Trigger, { value: 'active' }, 'Active (' + active.length + ')'),
            h(Tabs.Trigger, { value: 'past' }, 'Past (' + past.length + ')'))
        ),
        isPast ? h('div', { className: 'mt-4 flex flex-wrap items-center gap-2' },
          h('div', { className: 'relative flex-1', style: { minWidth: 220, maxWidth: 360 } },
            h('span', { className: 'text-muted-400 absolute', style: { left: 12, top: '50%', transform: 'translateY(-50%)' } }, Icon.search(16)),
            h(Input, { value: search, onChange: (e) => setSearch(e.target.value), placeholder: 'Search by title or classroom…', className: 'w-full', style: { paddingLeft: 36 } })),
          h('div', { style: { width: 170 } }, h(Select, { value: range, onValueChange: setRange },
            h(Select.Trigger, null, h(Select.Value, { placeholder: 'All time' }), h(Select.Icon)),
            h(Select.Content, null, h(Select.Item, { value: 'all' }, h(Select.Text, null, 'All time')), h(Select.Item, { value: '7' }, h(Select.Text, null, 'Last 7 days')), h(Select.Item, { value: '30' }, h(Select.Text, null, 'Last 30 days'))))),
          h('div', { style: { width: 190 } }, h(Select, { value: sort, onValueChange: setSort },
            h(Select.Trigger, null, h(Select.Value, { placeholder: 'Most recent' }), h(Select.Icon)),
            h(Select.Content, null, h(Select.Item, { value: 'recent' }, h(Select.Text, null, 'Most recent first')), h(Select.Item, { value: 'oldest' }, h(Select.Text, null, 'Oldest first')), h(Select.Item, { value: 'incidents' }, h(Select.Text, null, 'Most incidents')))))
        ) : null,
        h('div', { className: 'mt-4 flex flex-col gap-2.5' },
          list.length ? list.map(ExamRow) : h(RSK.BlankSlate ? RSK.BlankSlate : 'div', RSK.BlankSlate ? { title: 'No exams match your filters', description: 'Try a different search term or widen the date range.' } : { className: 'text-muted-foreground p-10 text-center text-sm' }, RSK.BlankSlate ? null : 'No exams match your filters.')
        )
      )
    );
  }

  function ExamList() {
    const { DsPreviewProvider } = window.RSK;
    return h(DsPreviewProvider, null, h(ExamListInner, null));
  }

  // ---------------------------------------------------------------- exports
  window.ActiveWorkspaceScreen = function () { return Workspace('active'); };
  window.PastWorkspaceScreen = function () { return Workspace('past'); };
  window.ExamListScreen = function () { return ExamList(); };
})();
