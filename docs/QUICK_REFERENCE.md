# Quick Reference - Draggable Resume Builder

## 🚀 Quick Links

- **Main Component**: `client/src/components/Resume/DraggableResumeBuilder.js`
- **Integration**: `client/src/pages/Resume/ResumeBuilder.js`
- **User Guide**: `docs/RESUME_BUILDER_USER_GUIDE.md`
- **Technical Docs**: `docs/DRAGGABLE_RESUME_BUILDER.md`

## 📋 12 Sections Checklist

- ✅ Personal Information
- ✅ Website & Social Links
- ✅ Professional Summary
- ✅ Skills & Interests
- ✅ Projects
- ✅ Certificates/Certifications
- ✅ Education
- ✅ Work Experience
- ✅ Volunteering
- ✅ Awards & Achievements
- ✅ Languages
- ✅ Publications

## 🎯 Key Functions

### Opening the Builder
```javascript
// In ResumeBuilder.js
<button onClick={() => setShowDraggableBuilder(true)}>
  Advanced Builder
</button>
```

### Saving Data
```javascript
// Callback in DraggableResumeBuilder
onSave={(resumeData) => {
  // resumeData = { sections: [...], data: {...} }
  const text = convertDraggableDataToText(resumeData);
  uploadAsFile(text);
}}
```

### Data Structure
```javascript
{
  sections: [
    { id: 'personal', title: 'Personal Information', icon: User, enabled: true, collapsed: false },
    // ... 11 more
  ],
  data: {
    personal: { fullName, email, phone, location, title },
    skills: { technical: [], soft: [], interests: [] },
    projects: [{ name, description, technologies, ... }],
    // ... other sections
  }
}
```

## 🔧 Common Tasks

### Adding a New Field to Existing Section
```javascript
// 1. Update initial state
const initialResumeData = {
  personal: {
    fullName: '',
    newField: '' // Add here
  }
}

// 2. Update section component
<InputField 
  label="New Field" 
  value={data.newField} 
  onChange={(v) => updateField('personal', 'newField', v)} 
/>

// 3. Update conversion function
function convertDraggableDataToText(resumeData) {
  // Add to appropriate section
  if (data.personal.newField) lines.push(data.personal.newField);
}
```

### Adding a New Array-Based Section
```javascript
// 1. Add to sections array
{ id: 'newsection', title: 'New Section', icon: Icon, enabled: true, collapsed: false }

// 2. Add to initial data
newsection: []

// 3. Create component
const NewSection = ({ data, addItem, removeItem, updateItem }) => {
  const template = { field1: '', field2: '' };
  return (
    <div className="p-6 space-y-4">
      {data.map((item, idx) => (
        <ItemCard key={idx} title={`Item ${idx + 1}`} onRemove={() => removeItem('newsection', idx)}>
          <InputField label="Field 1" value={item.field1} onChange={(v) => updateItem('newsection', idx, 'field1', v)} />
        </ItemCard>
      ))}
      <AddButton onClick={() => addItem('newsection', template)} label="Add Item" />
    </div>
  );
};

// 4. Add to switch statement
case 'newsection': return <NewSection {...props} />;

// 5. Add to conversion function
case 'newsection':
  if (data.newsection.length) {
    lines.push('NEW SECTION');
    data.newsection.forEach(item => {
      lines.push(item.field1);
      lines.push('');
    });
  }
  break;
```

## 🎨 Styling Classes

### Common Tailwind Classes Used
```
Container: p-6 space-y-4
Grid: grid grid-cols-1 md:grid-cols-2 gap-4
Input: input-field (custom class)
Button: btn-primary, btn-secondary
Card: border border-gray-200 rounded-lg p-4
Tag: bg-primary-100 text-primary-800 px-3 py-1 rounded-full
Icon: w-4 h-4, w-5 h-5
```

### Custom Classes Needed
```css
/* In your global CSS */
.input-field {
  @apply w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors;
}

.btn-secondary {
  @apply bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors;
}
```

## 🐛 Common Issues & Solutions

### Issue: Sections not dragging
**Solution**: Ensure drag handle has correct props
```javascript
<div {...provided.dragHandleProps}>
  <GripVertical />
</div>
```

### Issue: State not updating
**Solution**: Use functional updates
```javascript
// ❌ Wrong
setResumeData({ ...resumeData, personal: { ...resumeData.personal, name: value }});

// ✅ Correct
setResumeData(prev => ({ ...prev, personal: { ...prev.personal, name: value }}));
```

### Issue: Tags not removing
**Solution**: Filter array correctly
```javascript
const removeSkill = (type, index) => {
  updateArrayField('skills', {
    ...data,
    [type]: data[type].filter((_, i) => i !== index)
  });
};
```

### Issue: Conversion missing sections
**Solution**: Check section.enabled flag
```javascript
sections.forEach(section => {
  if (!section.enabled) return; // Skip disabled sections
  // ... conversion logic
});
```

## 📱 Responsive Breakpoints

```
Mobile:     Default (< 768px)
Tablet:     md: (≥ 768px)
Desktop:    lg: (≥ 1024px)
Wide:       xl: (≥ 1280px)
```

### Usage
```javascript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  // 1 col mobile, 2 cols tablet, 3 cols desktop
</div>
```

## 🔍 Debugging Tips

### Check State
```javascript
// Add to DraggableResumeBuilder
console.log('Sections:', sections);
console.log('Resume Data:', resumeData);
```

### Check Drag Events
```javascript
const handleDragEnd = (result) => {
  console.log('Drag result:', result);
  // ... rest of code
};
```

### Check Save Data
```javascript
const handleSave = () => {
  const saveData = { sections, data: resumeData };
  console.log('Saving:', saveData);
  if (onSave) onSave(saveData);
};
```

## 📊 Performance Tips

### Memoization
```javascript
import { memo } from 'react';

const PersonalInfoSection = memo(({ data, updateField }) => {
  // Component code
});
```

### Callback Optimization
```javascript
import { useCallback } from 'react';

const updateField = useCallback((section, field, value) => {
  setResumeData(prev => ({
    ...prev,
    [section]: { ...prev[section], [field]: value }
  }));
}, []);
```

## 🧪 Testing Commands

```bash
# Run dev server
npm start

# Build for production
npm run build

# Check for errors
npm run build | grep -i error

# Run linter (if configured)
npm run lint
```

## 📦 Package Dependencies

```json
{
  "react-beautiful-dnd": "^13.1.1",
  "lucide-react": "^0.263.1",
  "react-hot-toast": "^2.4.0",
  "react": "^18.2.0",
  "tailwindcss": "^3.3.2"
}
```

## 🔗 API Integration

### Upload Flow
```javascript
// 1. Convert to text
const text = convertDraggableDataToText(resumeData);

// 2. Create file
const blob = new Blob([text], { type: 'text/plain' });
const file = new File([blob], 'resume.txt', { type: 'text/plain' });

// 3. Upload
const formData = new FormData();
formData.append('resume', file);
await api.post('/resume', formData);
```

## 🎯 Quick Checklist for PRs

- [ ] No console errors
- [ ] No ESLint warnings
- [ ] All sections working
- [ ] Drag & drop functional
- [ ] Save functionality working
- [ ] Responsive on mobile
- [ ] Documentation updated
- [ ] Code commented
- [ ] Tested edge cases
- [ ] Performance acceptable

## 📚 Resources

- [React Beautiful DnD Docs](https://github.com/atlassian/react-beautiful-dnd)
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Hooks](https://react.dev/reference/react)

---

**Quick Help**: For issues, check `docs/DRAGGABLE_RESUME_BUILDER.md` troubleshooting section
