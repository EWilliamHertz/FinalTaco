import re

with open('src/app/messages/page.tsx', 'r') as f:
    content = f.read()

# Add import
if 'NewMessageClient' not in content:
    content = content.replace(
        'import { redirect } from "next/navigation";',
        'import { redirect } from "next/navigation";\nimport { NewMessageClient } from "./NewMessageClient";'
    )

    # Change empty state text
    content = content.replace(
        '<div className="text-gray-400">No conversations yet.</div>',
        '<div className="py-20 text-center opacity-50"><p className="font-serif text-2xl text-neutral-400 mb-2">No Conversations</p><p className="font-sans text-xs uppercase tracking-widest text-neutral-500 mb-6">Start chatting with other collectors.</p><NewMessageClient /></div>'
    )

    # Add button to header
    content = content.replace(
        '<h1 className="text-3xl font-bold mb-8 text-white">Messages</h1>',
        '<div className="flex justify-between items-end mb-8"><h1 className="font-serif text-4xl text-white font-light uppercase tracking-widest">Messages</h1><NewMessageClient /></div>'
    )

with open('src/app/messages/page.tsx', 'w') as f:
    f.write(content)
