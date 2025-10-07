import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer',
  description: 'Manage your customers in the Acme Dashboard.',
};

export default function Page() {
  return <p>Customer Page!</p>;
}