'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import postgres from 'postgres';



// See note in data.ts: disable prepared statements to work with pooled
// database proxies (pgbouncer) used by Supabase.
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require', prepare: false });

// ...existing createInvoice / updateInvoice / deleteInvoice exports...

export async function authenticate(formData: FormData) {
  try {
    if (!(formData instanceof FormData)) {
      throw new Error('Invalid form data');
    }

    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!email || !password) {
      return { success: false, error: 'Missing credentials' };
    }

    const users = await sql<{ id: string; name: string; email: string; password: string }[]>`
      SELECT id, name, email, password
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    if (!users || users.length === 0) {
      return { success: false, error: 'Invalid credentials' };
    }

    const user = users[0];

    // TODO: Replace this plaintext comparison with bcrypt.compare when passwords are hashed
    const valid = password === user.password;
    if (!valid) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Return minimal session info; adapt to your auth flow (set cookie, create session, etc.)
    return { success: true, user: { id: user.id, name: user.name, email: user.email } };
  } catch (err) {
    console.error('Authenticate error', err);
    return { success: false, error: 'Server error' };
  }
}

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });


export async function createInvoice( formData: FormData ) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });


  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

try {
    
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
    } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
    
    }
    revalidatePath('dashboard/invoices');
    redirect('/dashboard/invoices');
}


export async function deleteInvoice(id: string) {

    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
  // Parse and validate incoming form data
  // eslint-disable-next-line no-unsafe-optional-chaining
  const { customerId, amount, status } = FormSchema.omit({ date: true })?.parse({
    id,
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
    date: new Date().toISOString(),
  });

  const amountInCents = amount * 100;

  try {

      await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
      `;      
} catch (error) {
  console.error(error);
    return { message: 'Database Error: Failed to Update Invoice.' };
  }
  
  revalidatePath('/dashboard/invoices');

}