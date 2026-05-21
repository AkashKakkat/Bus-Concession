function Table({ columns, rows, emptyMessage = "No records found.", getRowKey }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {rows.map((row, rowIndex) => (
              <tr key={getRowKey ? getRowKey(row) : row._id || rowIndex} className="align-top hover:bg-slate-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-4">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 md:hidden">
                      {column.header}
                    </span>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? (
        <p className="border-t border-slate-100 px-4 py-5 text-sm text-slate-500">{emptyMessage}</p>
      ) : null}
    </div>
  );
}

export default Table;
