---
defaultOutput: docs/stories/{{EpicNum}}.{{StoryNum}}.{{Short Title Copied from Epic File specific story}}.md
smAgent:
  editableSections: Status, Story, Acceptance Criteria, Tasks / Subtasks, Dev Notes, Testing, Change Log
  sectionSpecificInstructions:
    "Dev Notes":
      - Populate relevant information, only what was pulled from actual artifacts from docs folder, relevant to this story
      - Do not invent information.
      - If known add Relevant Source Tree info that relates to this story.
      - If there were important notes from previous story that are relevant to this one, include them here.
      - Put enough information in this section so that the dev agent should NEVER need to read the architecture documents, these notes along with the tasks and subtasks must give the Dev Agent the complete context it needs to comprehend with the least amount of overhead the information to complete the story,  meeting all AC and completing all tasks+subtasks.
    Testing:
      - List Relevant Testing Standards from Architecture the Developer needs to conform to (test file location, test standards, etc)
      - Include build verification and integration testing requirements
      - Reference lessons-learned.md for critical testing gaps discovered 
---

# Story {{EpicNum}}.{{StoryNum}}: {{Short Title Copied from Epic File specific story}}

## Status: {{ Draft | Approved | InProgress | Review | Done }}

## Story

**As a** {{role}},\
**I want** {{action}},\
**so that** {{benefit}}

## Acceptance Criteria

{{ Copy of Acceptance Criteria numbered list }}

## Tasks / Subtasks

- [ ] Task 1 (AC: # if applicable)
  - [ ] Subtask1.1...
- [ ] Task 2 (AC: # if applicable)
  - [ ] Subtask 2.1...
- [ ] Task 3 (AC: # if applicable)
  - [ ] Subtask 3.1...

## Dev Notes

### Testing

#### Testing Standards
- **Framework**: Vitest (as configured in package.json)
- **Test Location**: `src/tools/__tests__/ToolName.test.ts`
- **Coverage**: Unit tests for all code paths
- **Live Testing**: Must test against actual YNAB development budget
- **Error Testing**: Test all error scenarios (missing token, missing parameters, invalid data, API errors)

#### Build Verification Requirements
- **Compilation Test**: Tool must compile to JavaScript successfully
- **File Existence**: Compiled file must exist in `dist/tools/`
- **Syntax Validation**: No TypeScript syntax should remain in compiled output
- **Required Tools List**: Tool must be included in build verification test

#### Integration Testing Requirements
- **MCP Server Loading**: Tool must load successfully in MCP server
- **Tool Registration**: Tool must appear in server tool list
- **Error Detection**: Catch compilation errors that prevent tool loading
- **Augment Chat Testing**: Tool must be usable in Augment Chat

#### Test Commands
- **Full Test Suite**: `npm test` (includes build verification)
- **Build Verification**: `npm run test:build-verification`
- **Coverage**: `npm run test:coverage` (includes build step)

#### Augment Chat Testing Prompt
After all tests pass and MCP server is restarted, provide this prompt to Augment Chat:

```
Please test the new [TOOL_NAME] tool. Use the [TOOL_NAME] tool with [SPECIFIC_TEST_PARAMETERS] to verify it works correctly with the YNAB development budget.
```

**Example for UpdateSingleTransactionTool:**
```
Please test the new update_single_transaction tool. Use the update_single_transaction tool with budgetId: "[YOUR_BUDGET_ID]", transactionId: "[EXISTING_TRANSACTION_ID]", and amount: -25.50 to verify it works correctly with the YNAB development budget.
```

#### Pre-Completion Checklist
- [ ] Unit tests pass
- [ ] Tool compiles to JavaScript successfully
- [ ] Compiled file exists in `dist/tools/`
- [ ] MCP server loads tool without errors
- [ ] Tool appears in server tool list
- [ ] **Restart MCP server** to ensure latest compiled tools are loaded
- [ ] Tool is usable in Augment Chat
- [ ] Provide specific test prompt for Augment Chat testing

## Change Log

| Date | Version | Description | Author |
| :--- | :------ | :---------- | :----- |

## Dev Agent Record

### Agent Model Used: {{Agent Model Name/Version}}

### Debug Log References

### Completion Notes List

### File List

## QA Results
