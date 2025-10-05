import postgres from 'postgres';

// Disable prepared statements to support pgbouncer / pooled connections
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require', prepare: false });

async function listInvoices() {
	const data = await sql`
    SELECT invoices.amount, customers.name
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE invoices.amount = 666;
  `;

	return data;
}


