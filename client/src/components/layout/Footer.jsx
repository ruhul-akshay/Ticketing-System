import React from 'react';

export default function Footer() {
  return (
    <footer className="py-4 px-6 border-t border-border bg-card text-center text-sm text-muted-foreground flex justify-between items-center">
      <span>&copy; {new Date().getFullYear()} TicketFlow</span>
      <div className="flex gap-4">
        <span className="hover:text-primary cursor-pointer transition-colors">Privacy</span>
        <span className="hover:text-primary cursor-pointer transition-colors">Terms</span>
      </div>
    </footer>
  );
}
