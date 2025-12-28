        /**
 * Browser-based Data Seeding Script
 * Run this in the browser console to generate test data
 * 
 * Usage:
 *   1. Open browser console (F12)
 *   2. Copy and paste this entire file
 *   3. Press Enter
 */

(function seedData() {
  const STORAGE_KEY = 'kanban-board-data'

  // Sample data for generating realistic cards
  const cardTitles = [
    'Implement user authentication',
    'Fix bug in payment processing',
    'Add dark mode support',
    'Optimize database queries',
    'Update API documentation',
    'Refactor component structure',
    'Add unit tests',
    'Improve error handling',
    'Design new dashboard',
    'Implement search functionality',
    'Add data validation',
    'Create user onboarding flow',
    'Optimize image loading',
    'Add accessibility features',
    'Implement caching strategy',
    'Update dependencies',
    'Fix memory leaks',
    'Add logging system',
    'Create admin panel',
    'Implement real-time updates',
  ]

  const cardDescriptions = [
    'This task requires careful implementation of security best practices.',
    'Need to investigate the root cause before fixing.',
    'Should follow the design system guidelines.',
    'Performance is critical for this feature.',
    'Documentation should be comprehensive and clear.',
    'Refactoring should maintain backward compatibility.',
    'Tests should cover edge cases.',
    'Error messages should be user-friendly.',
    'Design should be responsive and accessible.',
    'Search should be fast and accurate.',
  ]

  const tags = ['frontend', 'backend', 'urgent', 'bug', 'feature', 'refactor', 'testing', 'documentation']

  const listTitles = [
    'Backlog',
    'To Do',
    'In Progress',
    'Code Review',
    'Testing',
    'Done',
    'Blocked',
    'On Hold',
  ]

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  function generateCard(_listId) {
    const now = new Date().toISOString()
    const title = cardTitles[Math.floor(Math.random() * cardTitles.length)]
    const description = Math.random() > 0.5 
      ? cardDescriptions[Math.floor(Math.random() * cardDescriptions.length)]
      : ''
    const cardTags = tags
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 3) + 1)

    return {
      id: generateUUID(),
      title: `${title} ${Math.floor(Math.random() * 1000)}`,
      description,
      tags: cardTags,
      version: 1,
      lastModifiedAt: now,
      createdAt: now,
      updatedAt: now,
      archived: false,
    }
  }

  function generateList(title, numCards) {
    const now = new Date().toISOString()
    const listId = generateUUID()
    
    const cards = Array.from({ length: numCards }, () => generateCard(listId))

    return {
      id: listId,
      title,
      cards,
      archived: false,
      version: 1,
      lastModifiedAt: now,
      createdAt: now,
      updatedAt: now,
    }
  }

  function generateTestData() {
    const lists = []
    
    // Distribute 500+ cards across lists
    // Ensure at least one list has 30+ cards for virtualization testing
    const cardDistribution = [150, 100, 80, 70, 60, 50, 40, 30] // Total: 580 cards
    
    listTitles.forEach((title, index) => {
      const numCards = cardDistribution[index] || 30
      lists.push(generateList(title, numCards))
    })

    return { lists }
  }

  function saveData(data) {
    try {
      // Check if data already exists
      const existing = localStorage.getItem(STORAGE_KEY)
      if (existing) {
        const overwrite = confirm(
          '⚠️ Data already exists in localStorage. Do you want to overwrite it?\n\n' +
          'Click OK to overwrite, or Cancel to keep existing data.'
        )
        if (!overwrite) {
          console.log('❌ Seeding cancelled - existing data preserved')
          return false
        }
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      
      // Verify the data was saved
      const verified = localStorage.getItem(STORAGE_KEY)
      if (!verified) {
        throw new Error('Data was not saved - verification failed')
      }
      
      console.log('✅ Data saved successfully!')
      console.log(`📊 Generated ${data.lists.length} lists`)
      const totalCards = data.lists.reduce((sum, list) => sum + list.cards.length, 0)
      console.log(`📋 Total cards: ${totalCards}`)
      console.log(`💾 Storage key: ${STORAGE_KEY}`)
      console.log('\n📋 List breakdown:')
      data.lists.forEach(list => {
        console.log(`  - ${list.title}: ${list.cards.length} cards`)
      })
      console.log('\n💡 Tip: Refresh the page to see your data!')
      return true
    } catch (error) {
      console.error('❌ Failed to save data:', error)
      console.error('Error details:', error.message)
      return false
    }
  }

  console.log('🌱 Starting data seeding...')
  const data = generateTestData()
  const success = saveData(data)
  
  if (success) {
    console.log('\n✨ Seeding complete!')
    console.log('🔄 Refresh your browser to see the test data.')
    return data
  } else {
    console.log('\n❌ Seeding failed. Please check the console for errors.')
    return null
  }
})()

