---
name: claude-writing-workflow
description: "Louis Gleeson's 10-step professional writing workflow using Claude. Use this when you want to write high-quality articles, whitepapers, or ebooks with Claude's assistance. This workflow has been proven to produce 500+ articles, 23 whitepapers, and 3 ebooks."
license: Proprietary
---

# Louis Gleeson's Claude Writing Workflow

## Overview

This skill implements Louis Gleeson's battle-tested 10-step writing workflow using Claude. Over 2 years, this system produced 500 articles, 23 whitepapers, and 3 ebooks at $0.02 per article - outperforming human editors.

## The 10 Core Prompts

### 1. The 5-Minute First Draft

**Purpose**: Generate a complete first draft quickly to overcome writer's block.

**Prompt Template**:
```
Write a [word count] article on: [topic]

Target audience: [describe audience]
Tone: [professional/conversational/academic]
Key points to cover:
- [point 1]
- [point 2]
- [point 3]

Focus on getting ideas down. Don't worry about perfection.
```

**When to use**: At the very beginning of any writing project.

---

### 2. The Research Synthesizer

**Purpose**: Extract and organize key information from multiple sources.

**Prompt Template**:
```
I'm researching [topic]. Please:

1. Extract key arguments from these sources: [paste sources]
2. Identify common themes
3. Highlight contradictions or debates
4. Summarize in bullet points

Format: 
- Main Theme: [summary]
- Supporting Evidence: [citations]
- Counterarguments: [if any]
```

**When to use**: Before writing, during research phase.

---

### 3. The Clarity Surgeon

**Purpose**: Rewrite unclear sections for maximum clarity and impact.

**Prompt Template**:
```
Rewrite this for maximum clarity:

[paste unclear text]

Requirements:
- Use simple, direct language
- Break complex ideas into digestible chunks
- Remove jargon unless necessary
- Add examples where helpful
- Target reading level: [specify]
```

**When to use**: After first draft, when sections feel confusing.

---

### 4. The Hook Generator

**Purpose**: Create compelling headlines and opening paragraphs.

**Prompt Template**:
```
Generate 10 headline options for this article:

Topic: [topic]
Key benefit: [what reader gains]
Target audience: [who]

Headline styles to try:
- Question-based
- Number-based (listicle)
- How-to
- Contrarian/surprising
- Benefit-driven

Rank top 3 by click-through potential.
```

**When to use**: After completing the draft, before final edits.

---

### 5. The Citation Weaver

**Purpose**: Integrate sources naturally without disrupting flow.

**Prompt Template**:
```
Integrate these sources into my article naturally:

Article section: [paste text]

Sources to cite:
1. [Source Name, Year]: [key finding]
2. [Source Name, Year]: [key finding]

Requirements:
- Cite sources naturally in-text [Source Name, Year]
- Don't disrupt reading flow
- Use attribution phrases: "According to...", "Research shows..."
- Avoid plagiarism (paraphrase everything)
```

**When to use**: During revision, when adding credibility.

---

### 6. The Flow Fixer

**Purpose**: Improve transitions and logical progression between sections.

**Prompt Template**:
```
Improve the flow between these sections:

[paste sections]

Please:
1. Add transition sentences between sections
2. Ensure logical progression of ideas
3. Remove redundancies
4. Strengthen topic sentences
5. Create smooth reading experience

Highlight changes in [brackets].
```

**When to use**: After major structural edits.

---

### 7. The Tone Adjuster

**Purpose**: Adapt writing style to match target audience and platform.

**Prompt Template**:
```
Rewrite this passage for:

Audience: [specific audience]
Platform: [LinkedIn/Blog/Academic Journal/etc.]
Desired tone: [professional/friendly/authoritative/conversational]

Original text:
[paste text]

Maintain core message but adjust:
- Vocabulary level
- Sentence structure
- Examples and analogies
- Level of formality
```

**When to use**: When repurposing content for different platforms.

---

### 8. Story Structure Overlay

**Purpose**: Add narrative elements to make dry content engaging.

**Prompt Template**:
```
Add storytelling elements to this article:

[paste article]

Please incorporate:
1. HOOK - Start with a relatable scenario or question
2. PROBLEM - What challenge does the reader face?
3. STAKES - Why does this matter?
4. SOLUTION - Your main argument/advice
5. PROOF - Evidence and examples
6. COUNTERARGUMENTS - Address objections
7. TRANSFORMATION - What changes for the reader?
8. CALL TO ACTION - What should reader do now?

Keep factual accuracy. Just make it more engaging.
```

**When to use**: When content feels too dry or technical.

---

### 9. The Simplicity Test

**Purpose**: Ensure complex topics are explained clearly.

**Prompt Template**:
```
Explain this concept as if to someone who has never heard of it:

[paste complex section]

Requirements:
- Use analogies from everyday life
- Define technical terms in simple language
- Break down into step-by-step explanation
- Test: Could a smart 12-year-old understand this?

Then provide two versions:
1. For beginners
2. For intermediate readers (with more detail)
```

**When to use**: When writing about technical or complex topics.

---

### 10. The Final Polish

**Purpose**: Catch errors and improve overall quality before publishing.

**Prompt Template**:
```
Review this article for final publication:

[paste complete article]

Check for:
1. Grammar and spelling errors
2. Awkward phrasing
3. Repetitive words/phrases
4. Unclear sentences
5. Missing transitions
6. Weak verbs (replace with stronger alternatives)
7. Passive voice (convert to active where appropriate)
8. Consistency in tone and style

Provide:
- List of specific issues found
- Suggested fixes
- Overall quality score (1-10)
```

**When to use**: Final step before publishing.

---

## Recommended Workflow

### Phase 1: Planning (Prompts 1-2)
1. Use **Research Synthesizer** to gather and organize information
2. Use **5-Minute First Draft** to create initial version

### Phase 2: Refinement (Prompts 3, 6, 9)
3. Apply **Clarity Surgeon** to unclear sections
4. Use **Flow Fixer** to improve transitions
5. Apply **Simplicity Test** to complex parts

### Phase 3: Enhancement (Prompts 4, 5, 7, 8)
6. Generate compelling hooks with **Hook Generator**
7. Integrate sources using **Citation Weaver**
8. Adjust tone with **Tone Adjuster**
9. Add narrative with **Story Structure Overlay**

### Phase 4: Finalization (Prompt 10)
10. Run **Final Polish** before publishing

## Tips for Best Results

1. **Don't skip steps**: Each prompt builds on the previous work
2. **Iterate**: Run prompts multiple times if needed
3. **Customize**: Adapt prompts to your specific needs
4. **Save templates**: Keep your customized versions for reuse
5. **Combine prompts**: Sometimes you can merge 2-3 prompts for efficiency

## Example Usage

```
User: "I need to write a 2000-word article about AI in healthcare for a general audience blog."

Step 1: Research Synthesizer
"I'm researching AI in healthcare. Please extract key arguments from [sources]..."

Step 2: 5-Minute First Draft
"Write a 2000-word article on AI in healthcare. Target audience: general readers interested in technology. Tone: conversational but informative..."

Step 3: Clarity Surgeon
[Apply to technical sections about machine learning]

Step 4: Story Structure Overlay
[Add patient success stories and real-world examples]

Step 5: Hook Generator
[Create 10 headline options]

Step 6: Final Polish
[Review complete article]
```

## Cost Efficiency

- Average cost per article: $0.02 (using Claude)
- Time saved vs. human editor: 70-80%
- Quality: Comparable or better than human editors for most content types

## Related Skills

- `research-agent` - For deeper research needs
- `x-signal-daily` - For curating daily insights
- `youtube-learning` - For video content summarization

## Notes

- This workflow is optimized for Claude but can be adapted for other LLMs
- Best results come from clear, specific prompts
- Always review AI output for factual accuracy
- The workflow is iterative - don't expect perfection on first pass
