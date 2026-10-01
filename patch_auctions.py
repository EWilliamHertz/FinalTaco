import re

with open('src/app/auctions/page.tsx', 'r') as f:
    content = f.read()

# Add button inside empty state
empty_state = """
        <div className="text-center py-20 opacity-50">
          <p className="font-serif text-2xl text-neutral-400 mb-2">No active auctions</p>
          <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-6">Be the first to start one!</p>
          <button
            onClick={() => {
              setShowCreate(true);
              loadMyCards();
            }}
            className="px-6 py-2 bg-white text-black hover:bg-neutral-200 transition-colors rounded-lg font-sans text-xs uppercase tracking-widest"
          >
            Start Auction
          </button>
        </div>
"""

content = re.sub(
    r'<div className="text-center text-neutral-500 py-12">[\s\S]*?<\/div>',
    empty_state,
    content
)

# Also style the header button to match
content = content.replace(
    'className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"',
    'className="px-6 py-2 bg-white text-black hover:bg-neutral-200 transition-colors rounded-lg font-sans text-xs uppercase tracking-widest"'
)
content = content.replace(
    '<h1 className="text-3xl font-bold text-white">Active Auctions</h1>',
    '<h1 className="font-serif text-4xl text-white font-light uppercase tracking-widest">Auctions</h1>'
)

with open('src/app/auctions/page.tsx', 'w') as f:
    f.write(content)
