type PieceKind = 'function' | 'range' | 'value' | 'syntax';
type DragEdge = 'top' | 'right' | 'bottom' | 'left' | null;

type PieceState = {
  element: HTMLButtonElement;
  id: string;
  value: string;
  kind: PieceKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  homeX: number;
  homeY: number;
  dragging: boolean;
  hovered: boolean;
  used: boolean;
  dragAngle: number;
};

type FormulaStructureToken = Pick<PieceState, 'id' | 'value' | 'kind'>;

type FormulaIssue = {
  label: string;
  help: string;
  tokenIds: string[];
};

type FormulaCheckResult =
  | { valid: true; message: string }
  | { valid: false; issues: FormulaIssue[] };

type WorksheetCellKind = 'number' | 'text' | 'blank';

type WorksheetCell = {
  kind: WorksheetCellKind;
  raw: string;
};

type WorksheetModel = Map<string, WorksheetCell>;

type ReferenceSummary = {
  label: string;
  rows: number;
  columns: number;
  numbers: number;
  texts: number;
  blanks: number;
  unknowns: number;
};

type FormulaSemanticValue =
  | { kind: 'number'; label: string; tokenIds: string[] }
  | { kind: 'text'; label: string; raw: string; numericText: boolean; tokenIds: string[] }
  | { kind: 'reference'; label: string; reference: ReferenceSummary; tokenIds: string[] }
  | { kind: 'unknown'; label: string; tokenIds: string[] };

const FUNCTION_SIGNATURES: Record<string, { min: number; max?: number }> = {
  SUM: { min: 1 },
  COUNT: { min: 1 },
  AVERAGE: { min: 1 },
  SUMIF: { min: 2, max: 3 },
  COUNTIF: { min: 2, max: 2 },
  COUNTIFS: { min: 2 },
  SUMIFS: { min: 3 },
};

const NUMERIC_RESULT_FUNCTIONS = new Set(['SUM', 'COUNT', 'AVERAGE', 'SUMIF', 'SUMIFS', 'COUNTIF', 'COUNTIFS']);

const QUESTION_MAX_POINTS = 100;
const QUESTION_MAX_ATTEMPTS = 5;
const HELP_SCORE_PENALTY_PERCENT = 50;
const HELP_PURCHASE_STORAGE_PREFIX = 'formula-daily:question-help:v1:';
const QUESTION_SCORE_STORAGE_PREFIX = 'formula-daily:question-score:v1:';
const CHALK_PREFERENCE_STORAGE_KEY = 'formula-daily:chalk-enabled:v1';
const LEFT_SCROLL_PREFERENCE_STORAGE_KEY = 'formula-daily:left-scroll:v1';
const TOUCH_MODE_OVERRIDE_STORAGE_KEY = 'formula-daily:touch-mode-override:v1';
const DISABLE_TOUCH_TIP_STORAGE_KEY = 'formula-daily:disable-touch-mode-tip:v1';
const CLEAN_BACKGROUND_STORAGE_KEY = 'formula-daily:clean-background:v1';
const EMPTY_SUBMIT_WARNING_MS = 1500;
const HELP_CLUSTER_RECOVERY_MS = 1050;
const HELP_CLUSTER_RECOVERY_PULL_X = .0031;
const HELP_CLUSTER_RECOVERY_PULL_Y = .0011;
const HELP_CLUSTER_RECOVERY_DAMPING = .925;
const HELP_CLUSTER_RECOVERY_VERTICAL_KICK = .62;
const HELP_CLUSTER_RECOVERY_SETTLE_MS = 650;
const HELP_CLUSTER_OVERLAP_FORCE_PINNED = .082;
const HELP_CLUSTER_OVERLAP_FORCE_RECOVERY = .068;
const HELP_CLUSTER_OVERLAP_SHUFFLE = .11;
const HELP_PANEL_DESKTOP_BOTTOM_GAP = 18;
const HELP_PANEL_DESKTOP_SIDE_GAP = 18;
const HELP_PANEL_DESKTOP_WIDTH = 360;
const HELP_CLUSTER_OBSTACLE_GAP = 14;
const HELP_CLUSTER_MIN_FREE_RATIO = .5;
const HELP_INTRO_NOTICE_MS = 5000;
const TOUCH_SCROLL_CONTROL_HIDE_MS = 3000;
const LEFT_HANDED_NOTICE_MS = 2000;
const TOUCH_SCROLL_CONTROL_EDGE_GAP = 10;

const primeHelpClusterRecovery = (states: PieceState[], bounds: DOMRect) => {
  const targetX = bounds.width / 2;
  states.filter((state) => !state.used && !state.dragging && !state.hovered).forEach((state, index) => {
    const stateCentreX = state.x + state.width / 2;
    const horizontalDistance = targetX - stateCentreX;
    const nearTop = state.y < bounds.height * .24;
    const nearBottom = state.y + state.height > bounds.height * .76;
    let verticalDirection = index % 2 === 0 ? -1 : 1;
    if (nearTop) verticalDirection = 1;
    if (nearBottom) verticalDirection = -1;

    state.vx += Math.max(-2.2, Math.min(2.2, horizontalDistance * .009));
    state.vy += verticalDirection * (HELP_CLUSTER_RECOVERY_VERTICAL_KICK + (index % 3) * .08);
  });

  return performance.now() + HELP_CLUSTER_RECOVERY_MS;
};

const FORMULA_MARKER_WARNING_MS = 2200;

type FunctionHelpGuide = {
  signature: string;
  lines: string[];
};

const FUNCTION_HELP_GUIDES: Record<string, FunctionHelpGuide> = {
  SUM: {
    signature: 'SUM(<number or range>, ...)',
    lines: [
      '<number or range> supplies values to add.',
      'Text inside referenced cells or ranges is ignored.',
    ],
  },
  COUNT: {
    signature: 'COUNT(<value or range>, ...)',
    lines: [
      'Counts numeric values in the supplied values, cells, or ranges.',
      'Text and blank cells in references do not count.',
    ],
  },
  AVERAGE: {
    signature: 'AVERAGE(<number or range>, ...)',
    lines: [
      'Returns the mean of the numeric values supplied.',
      'Text and blank cells in references are ignored.',
    ],
  },
  SUMIF: {
    signature: 'SUMIF(<range>, <criteria>, [sum_range])',
    lines: [
      '<range> is checked against <criteria>.',
      '[sum_range] is optional and supplies the corresponding cells to add.',
      'Text criteria normally use quotation marks.',
    ],
  },
  COUNTIF: {
    signature: 'COUNTIF(<range>, <criteria>)',
    lines: [
      '<range> is the group of cells to check.',
      '<criteria> is the value or condition to match.',
      'Text criteria normally use quotation marks.',
    ],
  },
  COUNTIFS: {
    signature: 'COUNTIFS(<criteria_range1>, <criteria1>, ...)',
    lines: [
      'Each criteria range is followed by the condition to test.',
      'Add more range-and-criteria pairs for more conditions.',
      'All criteria ranges must use the same shape.',
    ],
  },
  SUMIFS: {
    signature: 'SUMIFS(<sum_range>, <criteria_range1>, <criteria1>, ...)',
    lines: [
      '<sum_range> is the range whose matching values are added.',
      'Each criteria range is followed by its condition.',
      'SUMIFS puts <sum_range> first, unlike SUMIF.',
    ],
  },
};

const ARITHMETIC_OPERATORS = new Set(['*', '+', '-', '/']);
const COMPARISON_OPERATORS = new Set(['=']);
const FORMULA_OPERATORS = new Set([...ARITHMETIC_OPERATORS, ...COMPARISON_OPERATORS]);

const parseNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

const buildWorksheetModel = (sampleDataSheet: HTMLElement | null): WorksheetModel => {
  const worksheet: WorksheetModel = new Map();
  const table = sampleDataSheet?.querySelector<HTMLTableElement>('table');
  if (!table) return worksheet;

  const columns = Array.from(table.querySelectorAll<HTMLTableCellElement>('thead th'))
    .slice(1)
    .map((cell) => cell.textContent?.trim().toUpperCase() ?? '');

  table.querySelectorAll<HTMLTableRowElement>('tbody tr').forEach((row) => {
    const rowNumber = row.querySelector<HTMLTableCellElement>('th')?.textContent?.trim();
    if (!rowNumber) return;

    row.querySelectorAll<HTMLTableCellElement>('td').forEach((cell, columnIndex) => {
      const column = columns[columnIndex];
      if (!column) return;
      const raw = cell.textContent?.trim() ?? '';
      const kind: WorksheetCellKind = !raw ? 'blank' : parseNumber(raw) !== null ? 'number' : 'text';
      worksheet.set(`${column}${rowNumber}`, { kind, raw });
    });
  });

  return worksheet;
};

const columnToNumber = (column: string) => [...column.toUpperCase()].reduce((total, character) => (
  total * 26 + character.charCodeAt(0) - 64
), 0);

const numberToColumn = (value: number) => {
  let column = '';
  let remainder = value;
  while (remainder > 0) {
    remainder -= 1;
    column = String.fromCharCode(65 + (remainder % 26)) + column;
    remainder = Math.floor(remainder / 26);
  }
  return column;
};

const summariseReference = (label: string, worksheet: WorksheetModel): ReferenceSummary | null => {
  const match = label.match(/^\$?([A-Z]+)\$?(\d+)(?::\$?([A-Z]+)\$?(\d+))?$/i);
  if (!match) return null;

  const startColumn = columnToNumber(match[1]);
  const startRow = Number(match[2]);
  const endColumn = columnToNumber(match[3] ?? match[1]);
  const endRow = Number(match[4] ?? match[2]);
  const firstColumn = Math.min(startColumn, endColumn);
  const lastColumn = Math.max(startColumn, endColumn);
  const firstRow = Math.min(startRow, endRow);
  const lastRow = Math.max(startRow, endRow);
  const summary: ReferenceSummary = {
    label,
    rows: lastRow - firstRow + 1,
    columns: lastColumn - firstColumn + 1,
    numbers: 0,
    texts: 0,
    blanks: 0,
    unknowns: 0,
  };

  for (let row = firstRow; row <= lastRow; row += 1) {
    for (let column = firstColumn; column <= lastColumn; column += 1) {
      const cell = worksheet.get(`${numberToColumn(column)}${row}`);
      if (!cell) {
        summary.unknowns += 1;
      } else if (cell.kind === 'number') {
        summary.numbers += 1;
      } else if (cell.kind === 'text') {
        summary.texts += 1;
      } else {
        summary.blanks += 1;
      }
    }
  }

  return summary;
};

const formulaIssue = (label: string, help: string, tokenIds: string[] = []): FormulaIssue => ({
  label,
  help,
  tokenIds: [...new Set(tokenIds.filter(Boolean))],
});

const dedupeFormulaIssues = (issues: FormulaIssue[]) => {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.label}|${[...issue.tokenIds].sort().join('|')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const sortFormulaIssues = (issues: FormulaIssue[], tokens: FormulaStructureToken[]) => {
  const tokenOrder = new Map(tokens.map((token, index) => [token.id, index]));
  return [...issues].sort((left, right) => {
    const leftIndex = Math.min(...left.tokenIds.map((id) => tokenOrder.get(id) ?? Number.MAX_SAFE_INTEGER));
    const rightIndex = Math.min(...right.tokenIds.map((id) => tokenOrder.get(id) ?? Number.MAX_SAFE_INTEGER));
    return leftIndex - rightIndex;
  });
};

const getOxfordListSeparator = (itemIndex: number, itemCount: number) => {
  if (itemIndex >= itemCount - 1) return '';
  if (itemCount === 2) return ' and ';
  if (itemIndex === itemCount - 2) return ', and ';
  return ', ';
};

const validateFormulaStructure = (tokens: FormulaStructureToken[]): FormulaIssue[] => {
  if (!tokens.length) {
    return [formulaIssue('Empty formula', 'Build a formula before testing it.')];
  }

  const issues: FormulaIssue[] = [];
  const addIssue = (issue: FormulaIssue) => issues.push(issue);
  const idsAt = (...indexes: number[]) => indexes.flatMap((tokenIndex) => tokens[tokenIndex]?.id ?? []);
  const isOperator = (token: FormulaStructureToken | undefined) => Boolean(token && FORMULA_OPERATORS.has(token.value));
  const startsOperand = (token: FormulaStructureToken | undefined) => Boolean(token && (
    token.kind === 'range' || token.kind === 'value' || token.kind === 'function' || token.value === '('
  ));
  const endsOperand = (token: FormulaStructureToken | undefined) => Boolean(token && (
    token.kind === 'range' || token.kind === 'value' || token.value === ')'
  ));
  const functionName = (token: FormulaStructureToken) => token.value.endsWith('(')
    ? token.value.slice(0, -1).toUpperCase()
    : token.value.toUpperCase();

  const bracketIssue = (...indexes: number[]) => formulaIssue(
    'Bracket error',
    'The brackets do not form a valid pair.',
    idsAt(...indexes),
  );
  const argumentIssue = (...indexes: number[]) => formulaIssue(
    'Argument error',
    'A function has missing, extra, or misplaced arguments.',
    idsAt(...indexes),
  );
  const syntaxIssue = (...indexes: number[]) => formulaIssue(
    'Syntax error',
    'Part of the formula is not valid in this position.',
    idsAt(...indexes),
  );
  const operatorIssue = (...indexes: number[]) => formulaIssue(
    'Operator error',
    'An operator is missing one of its values.',
    idsAt(...indexes),
  );

  const openingStack: number[] = [];
  const matchingClose = new Map<number, number>();
  const containingStackByIndex = new Map<number, number[]>();

  tokens.forEach((token, tokenIndex) => {
    containingStackByIndex.set(tokenIndex, [...openingStack]);

    if (token.kind === 'function' || token.value === '(') {
      openingStack.push(tokenIndex);
      return;
    }

    if (token.value === ')') {
      const openingIndex = openingStack.pop();
      if (openingIndex === undefined) {
        addIssue(bracketIssue(tokenIndex));
      } else {
        matchingClose.set(openingIndex, tokenIndex);
      }
      return;
    }

    if (token.value === ',') {
      const immediateContainer = openingStack.at(-1);
      if (immediateContainer === undefined || tokens[immediateContainer]?.kind !== 'function') {
        addIssue(syntaxIssue(tokenIndex));
      }
    }
  });

  openingStack.forEach((openingIndex) => addIssue(bracketIssue(openingIndex)));

  matchingClose.forEach((closingIndex, openingIndex) => {
    if (tokens[openingIndex]?.value === '(' && closingIndex === openingIndex + 1) {
      addIssue(syntaxIssue(openingIndex, closingIndex));
    }
  });

  tokens.forEach((token, functionIndex) => {
    if (token.kind !== 'function') return;
    const closingIndex = matchingClose.get(functionIndex);
    if (closingIndex === undefined) return;

    const name = functionName(token);
    const signature = FUNCTION_SIGNATURES[name];
    const commaIndexes: number[] = [];
    let nestedDepth = 0;

    for (let tokenIndex = functionIndex + 1; tokenIndex < closingIndex; tokenIndex += 1) {
      const nestedToken = tokens[tokenIndex];
      if (nestedToken.kind === 'function' || nestedToken.value === '(') {
        nestedDepth += 1;
      } else if (nestedToken.value === ')') {
        nestedDepth = Math.max(0, nestedDepth - 1);
      } else if (nestedToken.value === ',' && nestedDepth === 0) {
        commaIndexes.push(tokenIndex);
      }
    }

    const boundaries = [functionIndex, ...commaIndexes, closingIndex];
    const argumentCount = closingIndex === functionIndex + 1 ? 0 : boundaries.length - 1;

    for (let boundaryIndex = 0; boundaryIndex < boundaries.length - 1; boundaryIndex += 1) {
      const leftBoundary = boundaries[boundaryIndex];
      const rightBoundary = boundaries[boundaryIndex + 1];
      if (rightBoundary - leftBoundary > 1) continue;
      addIssue(argumentIssue(functionIndex, leftBoundary, rightBoundary));
    }

    if (!signature) return;
    const invalidCount = argumentCount < signature.min
      || (signature.max !== undefined && argumentCount > signature.max)
      || (name === 'COUNTIFS' && argumentCount % 2 !== 0)
      || (name === 'SUMIFS' && argumentCount % 2 === 0);
    if (invalidCount) addIssue(argumentIssue(functionIndex, closingIndex));
  });

  tokens.forEach((token, tokenIndex) => {
    if (!isOperator(token)) return;
    const previous = tokens[tokenIndex - 1];
    const next = tokens[tokenIndex + 1];
    const affectedIndexes = [tokenIndex];
    if (!endsOperand(previous) && previous) affectedIndexes.unshift(tokenIndex - 1);
    if (!startsOperand(next) && next) affectedIndexes.push(tokenIndex + 1);
    if (!endsOperand(previous) || !startsOperand(next)) addIssue(operatorIssue(...affectedIndexes));
  });

  for (let tokenIndex = 0; tokenIndex < tokens.length - 1; tokenIndex += 1) {
    const left = tokens[tokenIndex];
    const right = tokens[tokenIndex + 1];
    if (!endsOperand(left) || !startsOperand(right)) continue;

    const insideFunction = (containingStackByIndex.get(tokenIndex) ?? []).some((openingIndex) => (
      tokens[openingIndex]?.kind === 'function' && (matchingClose.get(openingIndex) ?? -1) > tokenIndex + 1
    ));
    addIssue(insideFunction
      ? argumentIssue(tokenIndex, tokenIndex + 1)
      : syntaxIssue(tokenIndex, tokenIndex + 1));
  }

  return dedupeFormulaIssues(issues);
};

const validateFormulaTypes = (tokens: FormulaStructureToken[], worksheet: WorksheetModel): FormulaIssue[] => {
  let index = 0;
  const issues: FormulaIssue[] = [];
  const current = () => tokens[index];
  const functionName = (token: FormulaStructureToken) => token.value.endsWith('(')
    ? token.value.slice(0, -1).toUpperCase()
    : token.value.toUpperCase();

  const isReference = (value: FormulaSemanticValue | undefined): value is Extract<FormulaSemanticValue, { kind: 'reference' }> => value?.kind === 'reference';
  const valueIssue = (...tokenIds: string[]) => formulaIssue(
    '#VALUE!',
    'Excel cannot use one of these values in this calculation.',
    tokenIds,
  );
  const divisionIssue = (...tokenIds: string[]) => formulaIssue(
    '#DIV/0!',
    'Excel cannot complete this calculation with the supplied values.',
    tokenIds,
  );
  const argumentIssue = (...tokenIds: string[]) => formulaIssue(
    'Argument error',
    'One function argument is not valid in this position.',
    tokenIds,
  );

  const hasValidArgumentCount = (name: string, count: number) => {
    const signature = FUNCTION_SIGNATURES[name];
    if (!signature) return true;
    if (count < signature.min) return false;
    if (signature.max !== undefined && count > signature.max) return false;
    if (name === 'COUNTIFS' && count % 2 !== 0) return false;
    if (name === 'SUMIFS' && count % 2 === 0) return false;
    return true;
  };

  const validateReferenceArgument = (functionTokenId: string, argument: FormulaSemanticValue | undefined) => {
    if (!argument || isReference(argument)) return null;
    return argumentIssue(functionTokenId, ...argument.tokenIds);
  };

  const numericOperatorIssue = (
    operatorToken: FormulaStructureToken,
    left: FormulaSemanticValue,
    right: FormulaSemanticValue,
  ): FormulaIssue | null => {
    const invalidValues = [left, right].filter((value) => {
      if (value.kind === 'number' || value.kind === 'unknown') return false;
      if (value.kind === 'text') return !value.numericText;
      return value.reference.unknowns === 0 && value.reference.texts > 0;
    });
    if (!invalidValues.length) return null;
    return valueIssue(operatorToken.id, ...invalidValues.flatMap((value) => value.tokenIds));
  };

  const validateFunctionTypes = (
    name: string,
    functionTokenId: string,
    args: FormulaSemanticValue[],
  ): FormulaIssue[] => {
    if (!hasValidArgumentCount(name, args.length)) return [];
    const functionIssues: FormulaIssue[] = [];

    if (name === 'SUM') {
      const directText = args.filter((argument) => argument.kind === 'text' && !argument.numericText);
      if (directText.length) {
        functionIssues.push(valueIssue(functionTokenId, ...directText.flatMap((argument) => argument.tokenIds)));
      }
      return functionIssues;
    }

    if (name === 'AVERAGE') {
      const directText = args.filter((argument) => argument.kind === 'text' && !argument.numericText);
      if (directText.length) {
        functionIssues.push(valueIssue(functionTokenId, ...directText.flatMap((argument) => argument.tokenIds)));
        return functionIssues;
      }

      const hasNumericValue = args.some((argument) => (
        argument.kind === 'number'
        || (argument.kind === 'reference' && argument.reference.numbers > 0)
        || argument.kind === 'unknown'
      ));
      if (!hasNumericValue) {
        functionIssues.push(divisionIssue(functionTokenId, ...args.flatMap((argument) => argument.tokenIds)));
      }
      return functionIssues;
    }

    if (name === 'COUNT') return functionIssues;

    if (name === 'COUNTIF') {
      const rangeError = validateReferenceArgument(functionTokenId, args[0]);
      if (rangeError) functionIssues.push(rangeError);
      return functionIssues;
    }

    if (name === 'COUNTIFS') {
      const firstRange = args[0];
      const firstRangeError = validateReferenceArgument(functionTokenId, firstRange);
      if (firstRangeError) functionIssues.push(firstRangeError);
      const firstShape = isReference(firstRange) ? firstRange.reference : null;

      for (let argumentIndex = 2; argumentIndex < args.length; argumentIndex += 2) {
        const range = args[argumentIndex];
        const rangeError = validateReferenceArgument(functionTokenId, range);
        if (rangeError) {
          functionIssues.push(rangeError);
          continue;
        }
        if (firstShape && isReference(range) && (
          range.reference.rows !== firstShape.rows || range.reference.columns !== firstShape.columns
        )) {
          functionIssues.push(valueIssue(functionTokenId, ...firstRange.tokenIds, ...range.tokenIds));
        }
      }
      return functionIssues;
    }

    if (name === 'SUMIF') {
      const rangeError = validateReferenceArgument(functionTokenId, args[0]);
      if (rangeError) functionIssues.push(rangeError);
      if (args[2]) {
        const sumRangeError = validateReferenceArgument(functionTokenId, args[2]);
        if (sumRangeError) functionIssues.push(sumRangeError);
      }
      return functionIssues;
    }

    if (name === 'SUMIFS') {
      const sumRange = args[0];
      const sumRangeError = validateReferenceArgument(functionTokenId, sumRange);
      if (sumRangeError) functionIssues.push(sumRangeError);
      const sumShape = isReference(sumRange) ? sumRange.reference : null;

      for (let argumentIndex = 1; argumentIndex < args.length; argumentIndex += 2) {
        const criteriaRange = args[argumentIndex];
        const rangeError = validateReferenceArgument(functionTokenId, criteriaRange);
        if (rangeError) {
          functionIssues.push(rangeError);
          continue;
        }
        if (sumShape && isReference(criteriaRange) && (
          criteriaRange.reference.rows !== sumShape.rows || criteriaRange.reference.columns !== sumShape.columns
        )) {
          functionIssues.push(valueIssue(functionTokenId, ...sumRange.tokenIds, ...criteriaRange.tokenIds));
        }
      }
      return functionIssues;
    }

    return functionIssues;
  };

  function parsePrimary(): FormulaSemanticValue {
    const token = current();
    if (!token) return { kind: 'unknown', label: 'incomplete expression', tokenIds: [] };

    if (token.kind === 'range') {
      index += 1;
      const reference = summariseReference(token.value, worksheet);
      return reference
        ? { kind: 'reference', label: token.value, reference, tokenIds: [token.id] }
        : { kind: 'unknown', label: token.value, tokenIds: [token.id] };
    }

    if (token.kind === 'value') {
      index += 1;
      if (/^".*"$/.test(token.value)) {
        const raw = token.value.slice(1, -1);
        return { kind: 'text', label: token.value, raw, numericText: parseNumber(raw) !== null, tokenIds: [token.id] };
      }
      if (parseNumber(token.value) !== null) {
        return { kind: 'number', label: token.value, tokenIds: [token.id] };
      }
      return { kind: 'unknown', label: token.value, tokenIds: [token.id] };
    }

    if (token.kind === 'function') return parseFunction(token);

    if (token.value === '(') {
      index += 1;
      const result = parseExpression(new Set([')']));
      if (current()?.value === ')') index += 1;
      return result;
    }

    index += 1;
    return { kind: 'unknown', label: token.value, tokenIds: [token.id] };
  }

  function parseFunction(token: FormulaStructureToken): FormulaSemanticValue {
    const startIndex = index;
    const name = functionName(token);
    index += 1;
    const args: FormulaSemanticValue[] = [];

    while (index < tokens.length && current().value !== ')') {
      const beforeArgument = index;
      args.push(parseExpression(new Set([',', ')'])));
      if (current()?.value === ',') index += 1;
      if (index === beforeArgument) index += 1;
    }
    if (current()?.value === ')') index += 1;

    const expressionTokenIds = tokens.slice(startIndex, index).map((formulaToken) => formulaToken.id);
    issues.push(...validateFunctionTypes(name, token.id, args));
    return NUMERIC_RESULT_FUNCTIONS.has(name)
      ? { kind: 'number', label: `${name}(...)`, tokenIds: expressionTokenIds }
      : { kind: 'unknown', label: `${name}(...)`, tokenIds: expressionTokenIds };
  }

  function parseExpression(stopValues: Set<string>): FormulaSemanticValue {
    let left = parsePrimary();

    while (index < tokens.length && !stopValues.has(current().value)) {
      const operatorToken = current();
      if (!FORMULA_OPERATORS.has(operatorToken.value)) break;
      index += 1;
      const right = parsePrimary();
      if (ARITHMETIC_OPERATORS.has(operatorToken.value)) {
        const operatorError = numericOperatorIssue(operatorToken, left, right);
        if (operatorError) issues.push(operatorError);
      }

      left = COMPARISON_OPERATORS.has(operatorToken.value)
        ? {
          kind: 'unknown',
          label: 'comparison',
          tokenIds: [...left.tokenIds, operatorToken.id, ...right.tokenIds],
        }
        : {
          kind: 'number',
          label: 'calculation',
          tokenIds: [...left.tokenIds, operatorToken.id, ...right.tokenIds],
        };
    }

    return left;
  }

  while (index < tokens.length) {
    const beforeExpression = index;
    parseExpression(new Set());
    if (index === beforeExpression) index += 1;
  }

  return dedupeFormulaIssues(issues);
};

const validateFormula = (tokens: FormulaStructureToken[], worksheet: WorksheetModel): FormulaCheckResult => {
  const structuralIssues = validateFormulaStructure(tokens);
  if (structuralIssues.some((issue) => issue.label === 'Empty formula')) {
    return { valid: false, issues: structuralIssues };
  }

  const issues = sortFormulaIssues(
    dedupeFormulaIssues([...structuralIssues, ...validateFormulaTypes(tokens, worksheet)]),
    tokens,
  );
  return issues.length
    ? { valid: false, issues }
    : { valid: true, message: 'No test errors found. Ready to submit.' };
};

type HoverLock = {
  state: PieceState;
  clientLeft: number;
  clientTop: number;
  hitLeft: number;
  hitTop: number;
  hitRight: number;
  hitBottom: number;
};

type ClusterPointer = {
  state: PieceState;
  id: number;
  started: boolean;
  moved: boolean;
  startX: number;
  startY: number;
  grabOffsetX: number;
  grabOffsetY: number;
  targetX: number;
  targetY: number;
  targetAngle: number;
  edge: DragEdge;
};

type PlacedPointer = {
  state: PieceState;
  token: HTMLButtonElement;
  ghost: HTMLButtonElement;
  id: number;
  moved: boolean;
  startX: number;
  startY: number;
  originalIndex: number;
  reorderIndex: number | null;
  reorderPreview: HTMLSpanElement;
  grabOffsetX: number;
  grabOffsetY: number;
  grabRatioX: number;
  grabRatioY: number;
  pointerX: number;
  pointerY: number;
  width: number;
  height: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  scale: number;
  targetScale: number;
  looseScale: number;
  zone: 'answer' | 'cluster';
  targetX: number;
  targetY: number;
  targetAngle: number;
  edge: DragEdge;
};

let testFeedbackSequence = 0;

document.querySelectorAll<HTMLElement>('[data-formula-daily]').forEach((root) => {
  const canvas = root.querySelector<HTMLElement>('[data-formula-canvas]');
  let boardNotes = root.querySelector<HTMLElement>('[data-board-notes]');
  const field = root.querySelector<HTMLElement>('[data-cluster-field]');
  const cluster = root.querySelector<HTMLElement>('[data-cluster]');
  const formulaEntry = root.querySelector<HTMLElement>('.formula-entry');
  const inputCell = root.querySelector<HTMLElement>('[data-input-cell]');
  const formulaOutput = root.querySelector<HTMLElement>('[data-formula-output]');
  const placeholder = root.querySelector<HTMLElement>('[data-placeholder]');
  const strings = root.querySelector<SVGSVGElement>('[data-strings]');
  const questionCurrent = root.querySelector<HTMLElement>('[data-question-current]');
  const pointsCurrent = root.querySelector<HTMLElement>('[data-points-current]');
  const attemptCount = root.querySelector<HTMLElement>('[data-attempt-count]');
  const optionsButton = root.querySelector<HTMLButtonElement>('[data-options-button]');
  const optionsPanel = root.querySelector<HTMLElement>('[data-options-panel]');
  const questionResetButton = root.querySelector<HTMLButtonElement>('[data-question-reset]');
  const chalkToggle = root.querySelector<HTMLInputElement>('[data-chalk-toggle]');
  const leftScrollToggle = root.querySelector<HTMLInputElement>('[data-left-scroll-toggle]');
  const touchModeToggle = root.querySelector<HTMLInputElement>('[data-touch-mode-toggle]');
  const disableTouchTipToggle = root.querySelector<HTMLInputElement>('[data-disable-touch-tip-toggle]');
  const cleanBackgroundToggle = root.querySelector<HTMLInputElement>('[data-clean-background-toggle]');
  const touchModeOption = root.querySelector<HTMLElement>('[data-touch-mode-option]');
  const touchOptionsLink = root.querySelector<HTMLButtonElement>('[data-touch-options-link]');
  const touchScrollControl = root.querySelector<HTMLButtonElement>('[data-touch-scroll-control]');
  const leftHandedNotice = root.querySelector<HTMLElement>('[data-left-handed-notice]');
  const status = root.querySelector<HTMLElement>('[data-status]');
  const clearButton = root.querySelector<HTMLButtonElement>('[data-clear]');
  const actions = root.querySelector<HTMLElement>('.formula-daily__actions');
  const helpButton = root.querySelector<HTMLButtonElement>('[data-help-button]');
  const helpPanel = root.querySelector<HTMLElement>('[data-help-panel]');
  const helpFunctions = root.querySelector<HTMLElement>('[data-help-functions]');
  const helpDetail = root.querySelector<HTMLElement>('[data-help-detail]');
  const helpCost = root.querySelector<HTMLElement>('[data-help-cost]');
  const helpPinButton = root.querySelector<HTMLButtonElement>('[data-help-pin]');
  const testAnswerButton = root.querySelector<HTMLButtonElement>('[data-test-answer]');
  const submitButton = root.querySelector<HTMLButtonElement>('[data-submit]');
  const sampleDataButton = root.querySelector<HTMLButtonElement>('[data-sample-data-open]');
  const sampleDataSheet = root.querySelector<HTMLElement>('[data-sample-data-sheet]');

  if (canvas && !boardNotes) {
    boardNotes = document.createElement('div');
    boardNotes.className = 'formula-canvas__notes';
    boardNotes.dataset.boardNotes = '';
    boardNotes.setAttribute('aria-hidden', 'true');
    canvas.prepend(boardNotes);
  }

  if (!canvas || !field || !cluster || !formulaEntry || !inputCell || !formulaOutput || !placeholder || !strings || !questionCurrent || !pointsCurrent || !attemptCount || !optionsButton || !optionsPanel || !questionResetButton || !chalkToggle || !leftScrollToggle || !touchModeToggle || !disableTouchTipToggle || !cleanBackgroundToggle || !touchModeOption || !touchOptionsLink || !touchScrollControl || !leftHandedNotice || !status || !clearButton || !actions || !helpButton || !helpPanel || !helpFunctions || !helpDetail || !helpCost || !helpPinButton || !testAnswerButton || !submitButton) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const placedIds: string[] = [];
  const states: PieceState[] = Array.from(field.querySelectorAll<HTMLButtonElement>('[data-piece-id]')).map((element) => ({
    element,
    id: element.dataset.pieceId ?? '',
    value: element.dataset.pieceValue ?? '',
    kind: (element.dataset.pieceKind ?? 'syntax') as PieceKind,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    width: 0,
    height: 0,
    homeX: 0,
    homeY: 0,
    dragging: false,
    hovered: false,
    used: false,
    dragAngle: 0,
  }));

  let currentQuestion = 1;
  let attempts = 0;
  let currentPointsExact = QUESTION_MAX_POINTS;
  let chalkEnabled = true;
  let leftScrollEnabled = false;
  let touchModeOverride: boolean | null = null;
  let touchModeEnabled = false;
  let observedTouchInput = false;
  let disableTouchTip = false;
  let cleanBackground = false;
  let touchScrollHideTimer = 0;
  let leftHandedNoticeTimer = 0;
  let touchScrollPointerId: number | null = null;
  let touchScrollGrabOffsetY = 0;
  let touchScrollHovered = false;
  const activeTouchIds = new Set<number>();
  let selectedCell = true;
  let previewId: string | null = null;
  let previewIndex: number | null = null;
  let visible = true;
  let frame = 0;
  let animationFrame = 0;
  let activePointer: ClusterPointer | null = null;
  let activePlacedPointer: PlacedPointer | null = null;
  let hoverLock: HoverLock | null = null;
  let suppressClickId: string | null = null;
  let suppressNextPlacedClick = false;
  let suppressPlacedClickTimer = 0;
  let clusterLayoutFrame = 0;
  let lastFieldWidth = 0;
  let lastAnswerHeight = 50;
  let clusterEnergy = 0;
  let clusterBreathingInset = 32;
  let clusterNaturalHeight = 190;
  let clusterHelpOccupiedDepth = 0;
  let helpPurchased = false;
  let helpPenaltyPercent = 0;
  let helpPanelPinned = false;
  let helpCloseTimer = 0;
  let helpIntroShown = false;
  let helpIntroActive = false;
  let helpIntroTimer = 0;
  let helpPromptFlashTimer = 0;
  let helpClusterRecoveryUntil = 0;
  let helpClusterRecoveryHardStop = 0;
  let formulaMarkerWarningActive = false;
  let formulaMarkerWarningTimer = 0;
  let emptySubmitWarningTimer = 0;

  const questionId = root.dataset.questionId?.trim() ?? '';
  const helpStorageKey = questionId ? `${HELP_PURCHASE_STORAGE_PREFIX}${questionId}` : '';
  const scoreStorageKey = questionId ? `${QUESTION_SCORE_STORAGE_PREFIX}${questionId}` : '';
  const clampPercent = (value: number) => Math.max(0, Math.min(100, value));
  const clampPoints = (value: number) => Math.max(0, Math.min(QUESTION_MAX_POINTS, value));
  const renderQuestionScore = () => {
    const visiblePoints = Math.max(0, Math.round(currentPointsExact));
    questionCurrent.textContent = String(currentQuestion);
    pointsCurrent.textContent = String(visiblePoints);
    attemptCount.textContent = String(attempts);
    submitButton.disabled = attempts >= QUESTION_MAX_ATTEMPTS;
    root.dataset.currentQuestion = String(currentQuestion);
    root.dataset.currentPoints = String(visiblePoints);
    root.dataset.currentPointsExact = currentPointsExact.toFixed(6);
    root.dataset.attemptsUsed = String(attempts);
  };
  const readStoredQuestionScore = () => {
    if (!scoreStorageKey) return null;
    try {
      const raw = window.localStorage.getItem(scoreStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { version?: number; attempts?: number; pointsExact?: number };
      if (parsed.version !== 1 || !Number.isFinite(parsed.attempts) || !Number.isFinite(parsed.pointsExact)) return null;
      return {
        attempts: Math.max(0, Math.min(QUESTION_MAX_ATTEMPTS, Math.trunc(Number(parsed.attempts)))),
        pointsExact: clampPoints(Number(parsed.pointsExact)),
      };
    } catch {
      return null;
    }
  };
  const persistQuestionScore = () => {
    if (!scoreStorageKey) return;
    try {
      window.localStorage.setItem(scoreStorageKey, JSON.stringify({
        version: 1,
        attempts,
        pointsExact: currentPointsExact,
      }));
    } catch {
      // Keep the in-memory score usable when storage is unavailable.
    }
  };
  const readStoredHelpPurchase = () => {
    if (!helpStorageKey) return null;
    try {
      const raw = window.localStorage.getItem(helpStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        version?: number;
        penaltyPercent?: number;
        maxScorePercent?: number;
        pointsAfterPurchase?: number;
      };
      if ((parsed.version !== 1 && parsed.version !== 2) || !Number.isFinite(parsed.penaltyPercent)) return null;
      const legacyPoints = Number.isFinite(parsed.maxScorePercent) ? Number(parsed.maxScorePercent) : QUESTION_MAX_POINTS;
      const storedPoints = Number.isFinite(parsed.pointsAfterPurchase) ? Number(parsed.pointsAfterPurchase) : legacyPoints;
      return {
        penaltyPercent: clampPercent(Number(parsed.penaltyPercent)),
        pointsAfterPurchase: clampPoints(storedPoints),
      };
    } catch {
      return null;
    }
  };
  const persistHelpPurchase = () => {
    if (!helpStorageKey) return;
    try {
      window.localStorage.setItem(helpStorageKey, JSON.stringify({
        version: 2,
        penaltyPercent: helpPenaltyPercent,
        pointsAfterPurchase: currentPointsExact,
      }));
    } catch {
      // Storage can be unavailable in restrictive/private browser contexts.
    }
  };
  const clearStoredHelpPurchase = () => {
    if (!helpStorageKey) return;
    try {
      window.localStorage.removeItem(helpStorageKey);
    } catch {
      // Keep the in-memory reset usable even when storage is unavailable.
    }
  };
  const clearStoredQuestionScore = () => {
    if (!scoreStorageKey) return;
    try {
      window.localStorage.removeItem(scoreStorageKey);
    } catch {
      // Keep the in-memory reset usable even when storage is unavailable.
    }
  };
  const readStoredChalkPreference = () => {
    try {
      const stored = window.localStorage.getItem(CHALK_PREFERENCE_STORAGE_KEY);
      if (stored === '0') return false;
      if (stored === '1') return true;
    } catch {
      // Fall back to the default chalk presentation when storage is unavailable.
    }
    return true;
  };
  const persistChalkPreference = () => {
    try {
      window.localStorage.setItem(CHALK_PREFERENCE_STORAGE_KEY, chalkEnabled ? '1' : '0');
    } catch {
      // The font toggle still works for the current session if storage is unavailable.
    }
  };
  const clearStoredChalkPreference = () => {
    try {
      window.localStorage.removeItem(CHALK_PREFERENCE_STORAGE_KEY);
    } catch {
      // Keep the in-memory reset usable even when storage is unavailable.
    }
  };
  const renderChalkPreference = () => {
    root.dataset.chalk = chalkEnabled ? 'on' : 'off';
    chalkToggle.checked = chalkEnabled;
  };
  const readStoredLeftScrollPreference = () => {
    try {
      return window.localStorage.getItem(LEFT_SCROLL_PREFERENCE_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  };
  const persistLeftScrollPreference = () => {
    try {
      window.localStorage.setItem(LEFT_SCROLL_PREFERENCE_STORAGE_KEY, leftScrollEnabled ? '1' : '0');
    } catch {
      // The side preference still works for the current session if storage is unavailable.
    }
  };
  const clearStoredLeftScrollPreference = () => {
    try {
      window.localStorage.removeItem(LEFT_SCROLL_PREFERENCE_STORAGE_KEY);
    } catch {
      // Keep the in-memory reset usable even when storage is unavailable.
    }
  };
  const renderLeftScrollPreference = () => {
    if (!touchModeEnabled && leftScrollEnabled) {
      leftScrollEnabled = false;
      clearStoredLeftScrollPreference();
    }
    leftScrollToggle.checked = leftScrollEnabled;
    leftScrollToggle.disabled = !touchModeEnabled;
    const option = leftScrollToggle.closest<HTMLElement>('.formula-canvas__option-toggle');
    if (option) option.dataset.disabled = String(!touchModeEnabled);
    touchScrollControl.dataset.side = leftScrollEnabled ? 'left' : 'right';
  };
  const readStoredBooleanPreference = (key: string) => {
    try {
      return window.localStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  };
  const persistBooleanPreference = (key: string, enabled: boolean) => {
    try {
      window.localStorage.setItem(key, enabled ? '1' : '0');
    } catch {
      // Keep the in-memory preference usable when storage is unavailable.
    }
  };
  const clearStoredBooleanPreference = (key: string) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Keep reset usable when storage is unavailable.
    }
  };
  const renderDisableTouchTipPreference = () => {
    if (touchModeEnabled && disableTouchTip) {
      disableTouchTip = false;
      persistBooleanPreference(DISABLE_TOUCH_TIP_STORAGE_KEY, false);
    }
    disableTouchTipToggle.checked = disableTouchTip;
    disableTouchTipToggle.disabled = touchModeEnabled;
    const option = disableTouchTipToggle.closest<HTMLElement>('.formula-canvas__option-toggle');
    if (option) option.dataset.disabled = String(touchModeEnabled);
    root.dataset.touchTipDisabled = String(disableTouchTip);
  };
  const renderCleanBackgroundPreference = () => {
    cleanBackgroundToggle.checked = cleanBackground;
    root.dataset.cleanBackground = String(cleanBackground);
  };
  const touchCapabilityMedia = window.matchMedia('(any-pointer: coarse)');
  const detectTouchCapability = () => observedTouchInput || navigator.maxTouchPoints > 0 || touchCapabilityMedia.matches;
  const readStoredTouchModeOverride = (): boolean | null => {
    try {
      const stored = window.localStorage.getItem(TOUCH_MODE_OVERRIDE_STORAGE_KEY);
      if (stored === 'on') return true;
      if (stored === 'off') return false;
    } catch {
      // Fall back to automatic touch detection when storage is unavailable.
    }
    return null;
  };
  const persistTouchModeOverride = () => {
    try {
      if (touchModeOverride === null) window.localStorage.removeItem(TOUCH_MODE_OVERRIDE_STORAGE_KEY);
      else window.localStorage.setItem(TOUCH_MODE_OVERRIDE_STORAGE_KEY, touchModeOverride ? 'on' : 'off');
    } catch {
      // Touch Mode still works for the current session if storage is unavailable.
    }
  };
  const clearStoredTouchModeOverride = () => {
    try {
      window.localStorage.removeItem(TOUCH_MODE_OVERRIDE_STORAGE_KEY);
    } catch {
      // Keep the in-memory reset usable even when storage is unavailable.
    }
  };
  const renderTouchModePreference = () => {
    touchModeEnabled = touchModeOverride ?? detectTouchCapability();
    touchModeToggle.checked = touchModeEnabled;
    root.dataset.touchMode = touchModeEnabled ? 'on' : 'off';
    renderLeftScrollPreference();
    renderDisableTouchTipPreference();
  };

  chalkEnabled = readStoredChalkPreference();
  leftScrollEnabled = readStoredLeftScrollPreference();
  touchModeOverride = readStoredTouchModeOverride();
  disableTouchTip = readStoredBooleanPreference(DISABLE_TOUCH_TIP_STORAGE_KEY);
  cleanBackground = readStoredBooleanPreference(CLEAN_BACKGROUND_STORAGE_KEY);
  renderChalkPreference();
  renderTouchModePreference();
  renderCleanBackgroundPreference();

  const storedQuestionScore = readStoredQuestionScore();
  if (storedQuestionScore) {
    attempts = storedQuestionScore.attempts;
    currentPointsExact = storedQuestionScore.pointsExact;
  }

  const storedHelpPurchase = readStoredHelpPurchase();
  if (storedHelpPurchase) {
    helpPurchased = true;
    helpPenaltyPercent = storedHelpPurchase.penaltyPercent;
    if (!storedQuestionScore) currentPointsExact = storedHelpPurchase.pointsAfterPurchase;
    helpIntroShown = true;
    root.dataset.helpUsed = 'true';
    root.dataset.helpPenaltyPercent = String(helpPenaltyPercent);
  }
  renderQuestionScore();

  const helpFunctionNames = Array.from(new Set(
    states
      .filter((state) => state.kind === 'function')
      .map((state) => state.value.endsWith('(') ? state.value.slice(0, -1).toUpperCase() : state.value.toUpperCase())
      .filter((name) => Boolean(FUNCTION_HELP_GUIDES[name])),
  ));
  let activeHelpFunction = helpFunctionNames[0] ?? null;

  const createSeededRandom = (seed: number) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const populateBoardNotes = () => {
    const dayKey = new Date().toISOString().slice(0, 10);
    const seed = [...dayKey].reduce((total, character, index) => total + character.charCodeAt(0) * (index + 7), 0);
    const random = createSeededRandom(seed);
    const lessons = [
      ['LESSON OF THE DAY\nConditional totals\nSUMIF = range + criteria', '11%', '13%', '-7deg', '23ch'],
      ['Remember\nCOUNTIF(range, criteria)\ntext criteria needs quotes', '66%', '11%', '5deg', '23ch'],
      ['Warm-up\nfind the range first\nthen choose the function', '7%', '62%', '-10deg', '21ch'],
      ['Board note\ncommas split arguments\nclose every bracket', '70%', '60%', '8deg', '20ch'],
      ['Today\x27s sheet\nA2:A5 = regions\nB2:B5 = units', '17%', '43%', '4deg', '18ch'],
      ['Quick rule\nSUM adds values\nAVERAGE = total / count', '55%', '39%', '-4deg', '21ch'],
      ['Example\n=COUNTIF(A2:A5, "East")', '30%', '70%', '-5deg', '27ch'],
      ['Homework\nbuild it left to right\nthen test your answer', '74%', '35%', '7deg', '20ch'],
    ];
    const positions = [...lessons].sort(() => random() - .5).slice(0, 4);
    const chalkPalette = ['#b8f4c9', '#b9ddff', '#ffc1d0', '#dcc8ff', '#ffe5ad'];
    const colourOffset = Math.floor(random() * chalkPalette.length);
    if (!boardNotes) return;
    boardNotes.replaceChildren();
    positions.forEach(([text, left, top, rotate, width], index) => {
      const note = document.createElement('span');
      note.className = 'formula-canvas__note';
      note.textContent = text;
      note.style.left = left;
      note.style.top = top;
      note.style.maxWidth = width;
      note.style.setProperty('--note-rotate', rotate);
      note.style.setProperty('--note-colour', chalkPalette[(colourOffset + index) % chalkPalette.length]);
      note.style.opacity = index === 0 ? '.16' : index === 1 ? '.11' : '.08';
      boardNotes.append(note);
    });
  };

  const renderHelpDetail = () => {
    helpDetail.replaceChildren();
    helpDetail.dataset.locked = String(!helpPurchased);
    helpCost.textContent = helpPurchased
      ? `Tips active · -${helpPenaltyPercent}% points`
      : `Reveal cost: -${HELP_SCORE_PENALTY_PERCENT}%`;

    helpFunctions.querySelectorAll<HTMLButtonElement>('[data-help-function]').forEach((button) => {
      const active = button.dataset.helpFunction === activeHelpFunction;
      button.dataset.locked = String(!helpPurchased);
      button.dataset.active = String(helpPurchased && active);
      button.setAttribute('aria-label', helpPurchased
        ? `${button.dataset.helpFunction} function tips`
        : `${button.dataset.helpFunction} tips are locked. Activate to show the Tips purchase prompt.`);
    });

    if (!activeHelpFunction) {
      if (!helpPanel.hidden) requestAnimationFrame(positionHelpPanel);
      return;
    }
    if (!helpPurchased) {
      const locked = document.createElement('span');
      locked.className = helpIntroActive
        ? 'formula-daily__help-lock formula-daily__help-lock--intro'
        : 'formula-daily__help-lock';

      const prompt = document.createElement('span');
      prompt.className = 'formula-daily__help-lock-prompt';

      if (helpIntroActive) {
        prompt.textContent = `Unlock tips for every puzzle function for -${HELP_SCORE_PENALTY_PERCENT}% points.`;
      } else {
        prompt.append(document.createTextNode('Reveal Tips? ('));
        const penalty = document.createElement('span');
        penalty.className = 'formula-daily__help-penalty';
        penalty.textContent = `-${HELP_SCORE_PENALTY_PERCENT}% points`;
        prompt.append(penalty, document.createTextNode(')'));
      }

      const buy = document.createElement('button');
      buy.type = 'button';
      buy.className = 'formula-daily__help-buy';
      buy.dataset.helpBuy = '';
      buy.textContent = 'Buy';
      buy.setAttribute('aria-label', `Buy function tips for ${HELP_SCORE_PENALTY_PERCENT} percent of your current points`);
      buy.addEventListener('click', purchaseHelp);

      locked.append(prompt, buy);
      helpDetail.append(locked);
      if (!helpPanel.hidden) requestAnimationFrame(positionHelpPanel);
      return;
    }

    const guide = FUNCTION_HELP_GUIDES[activeHelpFunction];
    if (!guide) return;

    const signature = document.createElement('span');
    signature.className = 'formula-daily__help-signature';
    signature.textContent = guide.signature;
    helpDetail.append(signature);

    guide.lines.forEach((line) => {
      const copy = document.createElement('span');
      copy.className = 'formula-daily__help-copy';
      copy.textContent = line;
      helpDetail.append(copy);
    });
    if (!helpPanel.hidden) requestAnimationFrame(positionHelpPanel);
  };

  const setActiveHelpFunction = (name: string) => {
    if (!FUNCTION_HELP_GUIDES[name]) return;
    activeHelpFunction = name;
    renderHelpDetail();
  };

  const cancelHelpClose = () => {
    if (!helpCloseTimer) return;
    window.clearTimeout(helpCloseTimer);
    helpCloseTimer = 0;
  };

  const showHelpIntro = () => {
    if (helpIntroShown) return;
    helpIntroShown = true;
    helpIntroActive = true;
    renderHelpDetail();
    if (helpIntroTimer) window.clearTimeout(helpIntroTimer);
    helpIntroTimer = window.setTimeout(() => {
      helpIntroActive = false;
      helpIntroTimer = 0;
      renderHelpDetail();
    }, HELP_INTRO_NOTICE_MS);
  };

  const flashHelpPurchasePrompt = () => {
    if (helpPurchased) return;
    if (helpPromptFlashTimer) window.clearTimeout(helpPromptFlashTimer);
    delete helpDetail.dataset.promptFlash;
    void helpDetail.offsetWidth;
    helpDetail.dataset.promptFlash = 'true';
    helpPromptFlashTimer = window.setTimeout(() => {
      delete helpDetail.dataset.promptFlash;
      helpPromptFlashTimer = 0;
    }, 560);
  };

  const isNarrowLayout = () => window.matchMedia('(max-width: 720px)').matches;
  const clearTouchScrollHideTimer = () => {
    if (!touchScrollHideTimer) return;
    window.clearTimeout(touchScrollHideTimer);
    touchScrollHideTimer = 0;
  };
  const getPageScrollRatio = () => {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    if (maxScroll <= 0) return 0;
    return Math.max(0, Math.min(1, window.scrollY / maxScroll));
  };
  const updateTouchScrollControlPosition = () => {
    if (touchScrollControl.hidden || !touchModeEnabled) return;
    const controlHeight = touchScrollControl.offsetHeight || 58;
    const trackStart = TOUCH_SCROLL_CONTROL_EDGE_GAP;
    const trackEnd = Math.max(trackStart, window.innerHeight - TOUCH_SCROLL_CONTROL_EDGE_GAP - controlHeight);
    const top = trackStart + (trackEnd - trackStart) * getPageScrollRatio();
    touchScrollControl.style.top = `${Math.round(top)}px`;
  };
  const showTouchScrollControl = () => {
    if (!touchModeEnabled) return;
    clearTouchScrollHideTimer();
    delete touchScrollControl.dataset.cooling;
    touchScrollControl.hidden = false;
    renderLeftScrollPreference();
    updateTouchScrollControlPosition();
  };
  const hideTouchScrollControl = () => {
    clearTouchScrollHideTimer();
    touchScrollControl.hidden = true;
    delete touchScrollControl.dataset.dragging;
    delete touchScrollControl.dataset.cooling;
    delete touchScrollControl.dataset.hovered;
    touchScrollPointerId = null;
    touchScrollHovered = false;
  };
  const scheduleTouchScrollControlHide = () => {
    if (touchScrollControl.hidden || touchScrollPointerId !== null || activeTouchIds.size > 0 || touchScrollHovered) return;
    clearTouchScrollHideTimer();
    touchScrollControl.dataset.cooling = 'true';
    touchScrollHideTimer = window.setTimeout(() => {
      touchScrollHideTimer = 0;
      if (touchScrollPointerId === null && activeTouchIds.size === 0 && !touchScrollHovered) hideTouchScrollControl();
    }, TOUCH_SCROLL_CONTROL_HIDE_MS);
  };
  const showLeftHandedNotice = () => {
    if (leftHandedNoticeTimer) window.clearTimeout(leftHandedNoticeTimer);
    leftHandedNotice.hidden = false;
    leftHandedNoticeTimer = window.setTimeout(() => {
      leftHandedNotice.hidden = true;
      leftHandedNoticeTimer = 0;
    }, LEFT_HANDED_NOTICE_MS);
  };

  const positionHelpPanel = () => {
    if (helpPanel.hidden) return;
    const actionsBounds = actions.getBoundingClientRect();
    const helpBounds = helpButton.getBoundingClientRect();
    const canvasBounds = canvas.getBoundingClientRect();
    const top = helpBounds.bottom - actionsBounds.top + 9;
    const narrowLayout = isNarrowLayout();

    helpPanel.dataset.layout = narrowLayout ? 'vertical' : 'horizontal';
    cluster.dataset.helpLayout = narrowLayout ? 'vertical' : 'horizontal';
    cluster.dataset.helpPinned = String(helpPanelPinned);
    helpPanel.style.width = '';
    helpPanel.style.height = '';
    helpPanel.style.maxWidth = '';

    if (narrowLayout) {
      helpPanel.style.left = '0px';
      helpPanel.style.top = `${Math.round(top)}px`;
      helpPanel.style.width = `${Math.max(0, Math.floor(actionsBounds.width))}px`;

      if (helpPanelPinned) {
        const panelBounds = helpPanel.getBoundingClientRect();
        const fieldBounds = field.getBoundingClientRect();
        const occupiedDepth = Math.max(0, panelBounds.bottom - fieldBounds.top + HELP_CLUSTER_OBSTACLE_GAP);
        clusterHelpOccupiedDepth = Math.ceil(occupiedDepth);
      } else {
        clusterHelpOccupiedDepth = 0;
      }
      syncClusterHeight();
      return;
    }

    clusterHelpOccupiedDepth = 0;
    syncClusterHeight();

    const fieldBounds = field.getBoundingClientRect();
    const maxPanelWidth = Math.max(0, Math.floor(
      fieldBounds.width * (1 - HELP_CLUSTER_MIN_FREE_RATIO) - HELP_CLUSTER_OBSTACLE_GAP,
    ));
    const panelWidth = Math.min(HELP_PANEL_DESKTOP_WIDTH, maxPanelWidth);
    helpPanel.style.width = `${panelWidth}px`;

    const panelRight = canvasBounds.right - actionsBounds.left - HELP_PANEL_DESKTOP_SIDE_GAP;
    const left = Math.max(0, panelRight - panelWidth);
    const panelBottom = canvasBounds.bottom - actionsBounds.top - HELP_PANEL_DESKTOP_BOTTOM_GAP;
    const panelHeight = Math.max(0, panelBottom - top);

    helpPanel.style.left = `${Math.round(left)}px`;
    helpPanel.style.top = `${Math.round(top)}px`;
    helpPanel.style.height = `${Math.round(panelHeight)}px`;
  };

  const renderHelpPinState = () => {
    const actionLabel = helpPanelPinned ? 'Unpin function tips' : 'Pin function tips';
    helpPinButton.dataset.pinned = String(helpPanelPinned);
    helpPinButton.setAttribute('aria-pressed', String(helpPanelPinned));
    helpPinButton.setAttribute('aria-label', actionLabel);
    helpPinButton.title = actionLabel;
  };

  const openHelpPanel = () => {
    cancelHelpClose();
    helpPanel.hidden = false;
    helpButton.setAttribute('aria-expanded', 'true');
    renderHelpPinState();
    positionHelpPanel();
  };

  const closeHelpPanel = (force = false) => {
    cancelHelpClose();
    if (helpPanelPinned && !force) return;
    helpPanel.hidden = true;
    helpButton.setAttribute('aria-expanded', 'false');
  };

  const scheduleHelpClose = () => {
    cancelHelpClose();
    helpCloseTimer = window.setTimeout(() => {
      helpCloseTimer = 0;
      if (helpPanelPinned || helpButton.matches(':hover') || helpPanel.matches(':hover') || helpPanel.contains(document.activeElement)) return;
      closeHelpPanel();
    }, 120);
  };

  const spendCurrentPointsByPercent = (percent: number) => {
    const boundedPercent = clampPercent(percent);
    currentPointsExact = clampPoints(currentPointsExact * (1 - boundedPercent / 100));
    renderQuestionScore();
    persistQuestionScore();
  };

  const purchaseHelp = () => {
    if (helpPurchased) return;
    helpPurchased = true;
    helpPenaltyPercent = HELP_SCORE_PENALTY_PERCENT;
    spendCurrentPointsByPercent(helpPenaltyPercent);
    root.dataset.helpUsed = 'true';
    root.dataset.helpPenaltyPercent = String(helpPenaltyPercent);
    persistHelpPurchase();
    if (helpIntroTimer) {
      window.clearTimeout(helpIntroTimer);
      helpIntroTimer = 0;
    }
    helpIntroActive = false;
    if (helpPromptFlashTimer) {
      window.clearTimeout(helpPromptFlashTimer);
      helpPromptFlashTimer = 0;
    }
    delete helpDetail.dataset.promptFlash;
    renderHelpDetail();
  };

  const clearTouchModeOptionHighlight = () => {
    delete touchModeOption.dataset.tipHighlight;
  };
  const highlightTouchModeOption = () => {
    delete touchModeOption.dataset.tipHighlight;
    void touchModeOption.offsetWidth;
    touchModeOption.dataset.tipHighlight = 'true';
  };
  const setOptionsPanelOpen = (open: boolean, highlightTouch = false) => {
    optionsPanel.hidden = !open;
    optionsButton.setAttribute('aria-expanded', String(open));
    if (!open) {
      clearTouchModeOptionHighlight();
      return;
    }
    if (highlightTouch) highlightTouchModeOption();
    else clearTouchModeOptionHighlight();
  };

  const resetQuestionState = () => {
    cancelHelpClose();
    if (helpIntroTimer) {
      window.clearTimeout(helpIntroTimer);
      helpIntroTimer = 0;
    }
    if (helpPromptFlashTimer) {
      window.clearTimeout(helpPromptFlashTimer);
      helpPromptFlashTimer = 0;
    }
    if (formulaMarkerWarningTimer) {
      window.clearTimeout(formulaMarkerWarningTimer);
      formulaMarkerWarningTimer = 0;
    }
    clearEmptySubmitWarning();

    clearStoredHelpPurchase();
    clearStoredQuestionScore();
    clearStoredChalkPreference();
    clearStoredLeftScrollPreference();
    clearStoredTouchModeOverride();
    clearStoredBooleanPreference(DISABLE_TOUCH_TIP_STORAGE_KEY);
    clearStoredBooleanPreference(CLEAN_BACKGROUND_STORAGE_KEY);

    currentQuestion = 1;
    attempts = 0;
    currentPointsExact = QUESTION_MAX_POINTS;
    chalkEnabled = true;
    leftScrollEnabled = false;
    touchModeOverride = null;
    disableTouchTip = false;
    cleanBackground = false;
    renderChalkPreference();
    renderTouchModePreference();
    renderCleanBackgroundPreference();
    hideTouchScrollControl();
    if (leftHandedNoticeTimer) {
      window.clearTimeout(leftHandedNoticeTimer);
      leftHandedNoticeTimer = 0;
    }
    leftHandedNotice.hidden = true;
    helpPurchased = false;
    helpPenaltyPercent = 0;
    helpIntroShown = false;
    helpIntroActive = false;
    helpPanelPinned = false;
    helpClusterRecoveryUntil = 0;
    helpClusterRecoveryHardStop = 0;
    activeHelpFunction = helpFunctionNames[0] ?? null;
    previewId = null;
    previewIndex = null;
    selectedCell = true;
    suppressClickId = null;
    suppressNextPlacedClick = false;
    if (suppressPlacedClickTimer) {
      window.clearTimeout(suppressPlacedClickTimer);
      suppressPlacedClickTimer = 0;
    }
    activePointer = null;
    activeTouchIds.clear();
    if (activePlacedPointer?.ghost.isConnected) activePlacedPointer.ghost.remove();
    activePlacedPointer = null;
    clusterEnergy = 0;

    releaseHoverLock();
    placedIds.length = 0;
    states.forEach((state) => {
      state.used = false;
      state.dragging = false;
      state.hovered = false;
      state.vx = 0;
      state.vy = 0;
      state.dragAngle = getBaseTilt(state);
      state.element.hidden = false;
      state.element.dataset.preview = 'false';
    });

    delete root.dataset.helpUsed;
    delete root.dataset.helpPenaltyPercent;
    delete helpDetail.dataset.promptFlash;
    setFormulaMarkerWarning(false);
    renderQuestionScore();
    renderHelpPinState();
    renderHelpDetail();
    closeHelpPanel(true);
    setOptionsPanelOpen(false);
    clearStatus();
    renderFormula();
    packCluster();
  };

  helpFunctionNames.forEach((name) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'formula-daily__help-function';
    button.dataset.helpFunction = name;
    button.textContent = name;
    button.addEventListener('mouseenter', () => {
      if (helpPurchased) setActiveHelpFunction(name);
    });
    button.addEventListener('focus', () => {
      if (helpPurchased) setActiveHelpFunction(name);
    });
    button.addEventListener('click', () => {
      if (!helpPurchased) {
        activeHelpFunction = name;
        renderHelpDetail();
        flashHelpPurchasePrompt();
        return;
      }
      setActiveHelpFunction(name);
    });
    helpFunctions.append(button);
  });
  renderQuestionScore();
  renderHelpDetail();
  renderHelpPinState();

  document.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch') return;
    observedTouchInput = true;
    if (touchModeOverride === null) renderTouchModePreference();
    if (!touchModeEnabled) return;
    activeTouchIds.add(event.pointerId);
    showTouchScrollControl();
  }, { capture: true });

  optionsButton.addEventListener('click', () => {
    setOptionsPanelOpen(optionsPanel.hidden);
  });
  touchOptionsLink.addEventListener('click', () => {
    setOptionsPanelOpen(true, true);
    optionsButton.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  });
  document.addEventListener('pointerdown', (event) => {
    if (optionsPanel.hidden) return;
    const target = event.target as Node | null;
    if (target && (optionsPanel.contains(target) || optionsButton.contains(target))) return;
    setOptionsPanelOpen(false);
  });
  questionResetButton.addEventListener('click', resetQuestionState);

  chalkToggle.addEventListener('change', () => {
    chalkEnabled = chalkToggle.checked;
    renderChalkPreference();
    persistChalkPreference();
    window.requestAnimationFrame(() => {
      renderFormula();
      packCluster();
      if (!helpPanel.hidden) positionHelpPanel();
    });
  });

  leftScrollToggle.addEventListener('change', () => {
    leftScrollEnabled = leftScrollToggle.checked;
    renderLeftScrollPreference();
    persistLeftScrollPreference();
    if (!touchScrollControl.hidden) updateTouchScrollControlPosition();
    if (leftScrollEnabled) showLeftHandedNotice();
  });

  touchModeToggle.addEventListener('change', () => {
    touchModeOverride = touchModeToggle.checked;
    persistTouchModeOverride();
    renderTouchModePreference();
    if (!touchModeEnabled) hideTouchScrollControl();
  });

  disableTouchTipToggle.addEventListener('change', () => {
    disableTouchTip = disableTouchTipToggle.checked;
    renderDisableTouchTipPreference();
    persistBooleanPreference(DISABLE_TOUCH_TIP_STORAGE_KEY, disableTouchTip);
  });

  cleanBackgroundToggle.addEventListener('change', () => {
    cleanBackground = cleanBackgroundToggle.checked;
    renderCleanBackgroundPreference();
    persistBooleanPreference(CLEAN_BACKGROUND_STORAGE_KEY, cleanBackground);
  });

  const movePageFromTouchScrollControl = (clientY: number) => {
    const controlHeight = touchScrollControl.offsetHeight || 58;
    const trackStart = TOUCH_SCROLL_CONTROL_EDGE_GAP;
    const trackEnd = Math.max(trackStart, window.innerHeight - TOUCH_SCROLL_CONTROL_EDGE_GAP - controlHeight);
    const desiredTop = Math.max(trackStart, Math.min(trackEnd, clientY - touchScrollGrabOffsetY));
    const ratio = trackEnd > trackStart ? (desiredTop - trackStart) / (trackEnd - trackStart) : 0;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    touchScrollControl.style.top = `${Math.round(desiredTop)}px`;
    window.scrollTo({ top: maxScroll * ratio, left: window.scrollX, behavior: 'instant' });
  };
  const finishTouchScrollControlDrag = (event: PointerEvent) => {
    if (touchScrollPointerId !== event.pointerId) return;
    try {
      if (touchScrollControl.hasPointerCapture(event.pointerId)) touchScrollControl.releasePointerCapture(event.pointerId);
    } catch { /* capture may already be released */ }
    touchScrollPointerId = null;
    delete touchScrollControl.dataset.dragging;
    if (event.pointerType === 'touch') touchScrollControl.blur();
    updateTouchScrollControlPosition();
    scheduleTouchScrollControlHide();
  };

  touchScrollControl.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0) || !touchModeEnabled) return;
    event.preventDefault();
    event.stopPropagation();
    showTouchScrollControl();
    touchScrollPointerId = event.pointerId;
    const bounds = touchScrollControl.getBoundingClientRect();
    touchScrollGrabOffsetY = event.clientY - bounds.top;
    touchScrollControl.dataset.dragging = 'true';
    try { touchScrollControl.setPointerCapture(event.pointerId); } catch { /* pointer capture is best effort */ }
  });
  touchScrollControl.addEventListener('pointermove', (event) => {
    if (touchScrollPointerId !== event.pointerId) return;
    event.preventDefault();
    movePageFromTouchScrollControl(event.clientY);
  });
  touchScrollControl.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'touch' || !touchModeEnabled || touchScrollControl.hidden) return;
    touchScrollHovered = true;
    touchScrollControl.dataset.hovered = 'true';
    showTouchScrollControl();
  });
  touchScrollControl.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'touch') return;
    touchScrollHovered = false;
    delete touchScrollControl.dataset.hovered;
    if (touchScrollPointerId !== null || activeTouchIds.size > 0) return;
    scheduleTouchScrollControlHide();
  });
  touchScrollControl.addEventListener('pointerup', finishTouchScrollControlDrag);
  touchScrollControl.addEventListener('pointercancel', finishTouchScrollControlDrag);

  const finishTouchActivity = (event: PointerEvent) => {
    if (event.pointerType !== 'touch' || !activeTouchIds.delete(event.pointerId)) return;
    scheduleTouchScrollControlHide();
  };
  document.addEventListener('pointerup', finishTouchActivity);
  document.addEventListener('pointercancel', finishTouchActivity);
  window.addEventListener('scroll', () => {
    if (!touchModeEnabled) return;
    if (touchScrollControl.hidden) showTouchScrollControl();
    // While the custom thumb is under the player's finger, its pointer position is
    // authoritative. Do not let scroll events reposition it from scrollY mid-drag.
    if (touchScrollPointerId !== null) return;
    updateTouchScrollControlPosition();
    if (activeTouchIds.size === 0) scheduleTouchScrollControlHide();
  }, { passive: true });
  window.addEventListener('resize', () => {
    if (touchModeOverride === null) renderTouchModePreference();
    if (!touchModeEnabled) {
      hideTouchScrollControl();
      return;
    }
    if (!touchScrollControl.hidden) updateTouchScrollControlPosition();
  }, { passive: true });
  touchCapabilityMedia.addEventListener('change', () => {
    if (touchModeOverride !== null) return;
    renderTouchModePreference();
    if (!touchModeEnabled) hideTouchScrollControl();
  });

  helpButton.addEventListener('mouseenter', () => {
    showHelpIntro();
    openHelpPanel();
  });
  helpButton.addEventListener('mouseleave', scheduleHelpClose);
  helpButton.addEventListener('focus', () => {
    showHelpIntro();
    openHelpPanel();
  });
  helpButton.addEventListener('blur', scheduleHelpClose);
  const setHelpPanelPinned = (pinned: boolean) => {
    const wasPinned = helpPanelPinned;
    helpPanelPinned = pinned;
    renderHelpPinState();
    if (helpPanelPinned) {
      helpClusterRecoveryUntil = 0;
      helpClusterRecoveryHardStop = 0;
      openHelpPanel();
      const narrowLayout = helpPanel.dataset.layout === 'vertical';
      states.filter((state) => !state.used && !state.dragging && !state.hovered).forEach((state, index) => {
        if (narrowLayout) {
          state.vx += (index % 2 === 0 ? -1 : 1) * .12;
          state.vy += 1.2 + (index % 4) * .18;
          return;
        }
        state.vx -= 1.2 + (index % 4) * .18;
        state.vy += (index % 2 === 0 ? -1 : 1) * .12;
      });
      clusterEnergy = Math.max(clusterEnergy, 1);
      requestTick();
      return;
    }

    closeHelpPanel(true);
    cluster.dataset.helpPinned = 'false';
    clusterHelpOccupiedDepth = 0;
    syncClusterHeight();
    if (wasPinned) {
      helpClusterRecoveryUntil = primeHelpClusterRecovery(states, field.getBoundingClientRect());
      helpClusterRecoveryHardStop = helpClusterRecoveryUntil + HELP_CLUSTER_RECOVERY_SETTLE_MS;
      clusterEnergy = Math.max(clusterEnergy, 1);
    }
    requestTick();
  };

  helpButton.addEventListener('click', () => {
    showHelpIntro();
    setHelpPanelPinned(!helpPanelPinned);
  });
  helpPinButton.addEventListener('click', (event) => {
    const nextPinned = !helpPanelPinned;
    if (event.detail > 0) helpPinButton.blur();
    setHelpPanelPinned(nextPinned);
  });
  helpPanel.addEventListener('mouseenter', cancelHelpClose);
  helpPanel.addEventListener('mouseleave', scheduleHelpClose);
  helpPanel.addEventListener('focusin', cancelHelpClose);
  helpPanel.addEventListener('focusout', scheduleHelpClose);
  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!optionsPanel.hidden) {
      setOptionsPanelOpen(false);
      optionsButton.focus();
      return;
    }
    if (helpPanel.hidden) return;
    setHelpPanelPinned(false);
    helpButton.focus();
  });

  const clearTestErrorHighlight = () => {
    formulaOutput.querySelectorAll<HTMLElement>('[data-test-error="true"]').forEach((token) => {
      delete token.dataset.testError;
    });
  };

  const setTestErrorHighlight = (tokenIds: string[], active: boolean) => {
    clearTestErrorHighlight();
    if (!active) return;
    const targets = new Set(tokenIds);
    formulaOutput.querySelectorAll<HTMLElement>('[data-placed-id]').forEach((token) => {
      if (targets.has(token.dataset.placedId ?? '')) token.dataset.testError = 'true';
    });
  };

  const clearStatus = () => {
    clearTestErrorHighlight();
    status.replaceChildren();
  };

  const announce = (message: string) => {
    clearTestErrorHighlight();
    status.textContent = message;
  };

  const announceTestResult = (result: FormulaCheckResult) => {
    if (result.valid) {
      announce(result.message);
      return;
    }
    if (result.issues.length === 1 && result.issues[0].label === 'Empty formula') {
      announce('Build a formula first.');
      return;
    }

    clearTestErrorHighlight();
    let pinnedIssueIndex: number | null = null;
    const issueEntries = result.issues.map((resultIssue, issueIndex) => {
      const issue = document.createElement('span');
      issue.className = 'formula-daily__test-issue';

      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'formula-daily__error-link';
      trigger.textContent = resultIssue.label;

      const tooltip = document.createElement('span');
      tooltip.className = 'formula-daily__error-tooltip';
      tooltip.id = `formula-test-error-${++testFeedbackSequence}`;
      tooltip.setAttribute('role', 'tooltip');
      tooltip.textContent = resultIssue.help;
      trigger.setAttribute('aria-describedby', tooltip.id);
      trigger.setAttribute('aria-expanded', 'false');

      issue.append(trigger, tooltip);
      return { issue, trigger, resultIssue, issueIndex };
    });

    const restorePinnedTargets = () => {
      if (pinnedIssueIndex === null) {
        clearTestErrorHighlight();
        return;
      }
      setTestErrorHighlight(issueEntries[pinnedIssueIndex].resultIssue.tokenIds, true);
    };

    issueEntries.forEach(({ issue, trigger, resultIssue, issueIndex }) => {
      const showTargets = () => setTestErrorHighlight(resultIssue.tokenIds, true);
      trigger.addEventListener('mouseenter', showTargets);
      trigger.addEventListener('mouseleave', restorePinnedTargets);
      trigger.addEventListener('focus', showTargets);
      trigger.addEventListener('blur', restorePinnedTargets);
      trigger.addEventListener('click', (event) => {
        if (event.detail === 0) return;
        const nextPinnedIndex = pinnedIssueIndex === issueIndex ? null : issueIndex;
        issueEntries.forEach(({ issue: entryIssue, trigger: entryTrigger }) => {
          delete entryIssue.dataset.open;
          entryTrigger.setAttribute('aria-expanded', 'false');
        });
        pinnedIssueIndex = nextPinnedIndex;
        if (pinnedIssueIndex !== null) {
          issue.dataset.open = 'true';
          trigger.setAttribute('aria-expanded', 'true');
        }
        restorePinnedTargets();
      });
    });

    const message = document.createDocumentFragment();
    message.append(document.createTextNode('Test found: '));
    issueEntries.forEach(({ issue }, issueIndex) => {
      message.append(issue);
      const separator = getOxfordListSeparator(issueIndex, issueEntries.length);
      if (separator) message.append(document.createTextNode(separator));
    });
    status.replaceChildren(message);
  };

  const clearEmptySubmitWarning = () => {
    if (emptySubmitWarningTimer) {
      window.clearTimeout(emptySubmitWarningTimer);
      emptySubmitWarningTimer = 0;
    }
    delete placeholder.dataset.emptySubmitWarning;
    delete submitButton.dataset.emptySubmitWarning;
  };

  const showEmptySubmitWarning = () => {
    clearEmptySubmitWarning();
    placeholder.dataset.emptySubmitWarning = 'true';
    submitButton.dataset.emptySubmitWarning = 'true';
    announce('Add at least one formula piece before submitting.');
    emptySubmitWarningTimer = window.setTimeout(() => {
      emptySubmitWarningTimer = 0;
      delete placeholder.dataset.emptySubmitWarning;
      delete submitButton.dataset.emptySubmitWarning;
    }, EMPTY_SUBMIT_WARNING_MS);
  };

  const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));

  const getBaseTilt = (state: PieceState) => ((states.indexOf(state) * 7) % 11) - 5;

  const getCanvasDragBounds = () => {
    const bounds = canvas.getBoundingClientRect();
    const style = getComputedStyle(canvas);
    const leftInset = Number.parseFloat(style.borderLeftWidth) + 5;
    const rightInset = Number.parseFloat(style.borderRightWidth) + 5;
    const topInset = Number.parseFloat(style.borderTopWidth) + 5;
    const bottomInset = Number.parseFloat(style.borderBottomWidth) + 5;
    return {
      left: bounds.left + leftInset,
      right: bounds.right - rightInset,
      top: bounds.top + topInset,
      bottom: bounds.bottom - bottomInset,
    };
  };

  const releaseHoverLock = (state: PieceState | null = null) => {
    if (!hoverLock || (state && hoverLock.state !== state)) return;
    hoverLock.state.hovered = false;
    hoverLock = null;
    requestTick();
  };

  const HOVER_HIT_SLOP = 5;

  const pointerInsideHoverLock = (clientX: number, clientY: number) => (
    Boolean(hoverLock)
    && clientX >= (hoverLock?.hitLeft ?? 0)
    && clientX <= (hoverLock?.hitRight ?? 0)
    && clientY >= (hoverLock?.hitTop ?? 0)
    && clientY <= (hoverLock?.hitBottom ?? 0)
  );

  const pinHoveredPiece = (state: PieceState) => {
    if (state.used || state.dragging) return;
    if (hoverLock?.state !== state) releaseHoverLock();
    const bounds = state.element.getBoundingClientRect();
    const fieldBounds = field.getBoundingClientRect();
    state.hovered = true;
    state.vx = 0;
    state.vy = 0;
    hoverLock = {
      state,
      // Anchor the piece at its actual transform origin rather than the rotated
      // bounding box. This keeps hover visual-only and avoids a positional pop.
      clientLeft: fieldBounds.left + state.x,
      clientTop: fieldBounds.top + state.y,
      hitLeft: bounds.left - HOVER_HIT_SLOP,
      hitTop: bounds.top - HOVER_HIT_SLOP,
      hitRight: bounds.right + HOVER_HIT_SLOP,
      hitBottom: bounds.bottom + HOVER_HIT_SLOP,
    };
  };

  const syncHoveredPieceToViewport = (fieldBounds = field.getBoundingClientRect()) => {
    if (!hoverLock || hoverLock.state.used || hoverLock.state.dragging) return;
    const state = hoverLock.state;
    const canvasBounds = getCanvasDragBounds();
    const minX = canvasBounds.left - fieldBounds.left;
    const maxX = canvasBounds.right - fieldBounds.left - state.width;
    const minY = canvasBounds.top - fieldBounds.top;
    const maxY = canvasBounds.bottom - fieldBounds.top - state.height;
    state.x = clamp(hoverLock.clientLeft - fieldBounds.left, minX, maxX);
    state.y = clamp(hoverLock.clientTop - fieldBounds.top, minY, maxY);
    state.vx = 0;
    state.vy = 0;
    setPosition(state);
  };

  const pickEdge = (rawX: number, rawY: number, minX: number, maxX: number, minY: number, maxY: number): DragEdge => {
    const candidates: Array<[Exclude<DragEdge, null>, number]> = [];
    const left = minX - rawX;
    const right = rawX - maxX;
    const top = minY - rawY;
    const bottom = rawY - maxY;
    if (left > 0) candidates.push(['left', left]);
    if (right > 0) candidates.push(['right', right]);
    if (top > 0) candidates.push(['top', top]);
    if (bottom > 0) candidates.push(['bottom', bottom]);
    if (!candidates.length) return null;
    candidates.sort((a, b) => b[1] - a[1]);
    return candidates[0][0];
  };

  const edgeAngle = (state: PieceState, edge: DragEdge, overshoot = 0) => {
    const base = getBaseTilt(state);
    const pull = Math.min(12, 4 + overshoot * .04);
    if (edge === 'left') return base - pull;
    if (edge === 'right') return base + pull;
    if (edge === 'top') return base - Math.min(5, pull * .45);
    if (edge === 'bottom') return base + Math.min(5, pull * .45);
    return base;
  };

  const getClusterDragTarget = (state: PieceState, clientX: number, clientY: number, grabOffsetX: number, grabOffsetY: number) => {
    const fieldBounds = field.getBoundingClientRect();
    const canvasBounds = getCanvasDragBounds();
    const minX = canvasBounds.left - fieldBounds.left;
    const maxX = canvasBounds.right - fieldBounds.left - state.width;
    const minY = canvasBounds.top - fieldBounds.top;
    const maxY = canvasBounds.bottom - fieldBounds.top - state.height;
    const rawX = clientX - fieldBounds.left - grabOffsetX;
    const rawY = clientY - fieldBounds.top - grabOffsetY;
    const edge = pickEdge(rawX, rawY, minX, maxX, minY, maxY);
    const overshoot = edge === 'left' ? minX - rawX
      : edge === 'right' ? rawX - maxX
        : edge === 'top' ? minY - rawY
          : edge === 'bottom' ? rawY - maxY
            : 0;
    return {
      x: clamp(rawX, minX, maxX),
      y: clamp(rawY, minY, maxY),
      edge,
      angle: edgeAngle(state, edge, overshoot),
      minX,
      maxX,
      minY,
      maxY,
    };
  };

  const getViewportDragTarget = (state: PieceState, width: number, height: number, clientX: number, clientY: number, grabOffsetX: number, grabOffsetY: number) => {
    const canvasBounds = getCanvasDragBounds();
    const minX = canvasBounds.left;
    const maxX = canvasBounds.right - width;
    const minY = canvasBounds.top;
    const maxY = canvasBounds.bottom - height;
    const rawX = clientX - grabOffsetX;
    const rawY = clientY - grabOffsetY;
    const edge = pickEdge(rawX, rawY, minX, maxX, minY, maxY);
    const overshoot = edge === 'left' ? minX - rawX
      : edge === 'right' ? rawX - maxX
        : edge === 'top' ? minY - rawY
          : edge === 'bottom' ? rawY - maxY
            : 0;
    return {
      x: clamp(rawX, minX, maxX),
      y: clamp(rawY, minY, maxY),
      edge,
      angle: edgeAngle(state, edge, overshoot),
    };
  };

  const setEdgeContact = (element: HTMLElement | null, edge: DragEdge) => {
    if (edge && element) element.dataset.edge = edge;
    else if (element) delete element.dataset.edge;
    if (edge) {
      canvas.dataset.edgeActive = 'true';
      canvas.dataset.edge = edge;
    } else {
      delete canvas.dataset.edgeActive;
      delete canvas.dataset.edge;
    }
  };

  const overlapRatio = (left: number, top: number, width: number, height: number, bounds: DOMRect) => {
    const overlapWidth = Math.max(0, Math.min(left + width, bounds.right) - Math.max(left, bounds.left));
    const overlapHeight = Math.max(0, Math.min(top + height, bounds.bottom) - Math.max(top, bounds.top));
    return (overlapWidth * overlapHeight) / Math.max(1, width * height);
  };

  const stateOverAnswer = (state: PieceState) => {
    const fieldBounds = field.getBoundingClientRect();
    const answerBounds = inputCell.getBoundingClientRect();
    const left = fieldBounds.left + state.x;
    const top = fieldBounds.top + state.y;
    const centreX = left + state.width / 2;
    const centreY = top + state.height / 2;
    return pointInside(centreX, centreY, answerBounds, 7)
      || overlapRatio(left, top, state.width, state.height, answerBounds) >= .28;
  };

  const CLUSTER_PAD_X = 7;
  const CLUSTER_PAD_Y = 6;
  const CLUSTER_MIN_GAP_X = 10;
  const CLUSTER_MAX_GAP_X = 24;
  const CLUSTER_GAP_Y = 12;
  const CLUSTER_MOTION_PAD_Y = 14;
  const CLUSTER_COLLISION_GAP = 10;
  const CLUSTER_GRAVITY_PULL = .0007;
  const CLUSTER_WANDER_FORCE = .004;
  const CLUSTER_DAMPING = .91;
  const CLUSTER_SLEEP_SPEED = .035;
  const CLUSTER_MAX_SPEED = 7.5;
  const CLUSTER_ENERGY_DECAY = .982;
  const CLUSTER_ENERGY_SLEEP = .025;

  const getClusterBreathingInset = (pieceCount: number, rowCount: number) => (
    clamp(18 + pieceCount * .8 + Math.max(0, rowCount - 2) * 5, 28, 52)
  );

  const syncClusterHeight = () => {
    const available = states.filter((state) => !state.used);
    const bottom = available.length
      ? Math.max(...available.map((state) => state.homeY + state.height))
      : 0;
    clusterNaturalHeight = Math.max(18, Math.ceil(bottom + CLUSTER_PAD_Y + clusterBreathingInset));
    const nextHeight = clusterNaturalHeight + clusterHelpOccupiedDepth;
    cluster.style.setProperty('--cluster-height', `${nextHeight}px`);
  };

  const scheduleClusterHeight = () => {
    if (clusterLayoutFrame) cancelAnimationFrame(clusterLayoutFrame);
    clusterLayoutFrame = requestAnimationFrame(() => {
      clusterLayoutFrame = 0;
      syncClusterHeight();
    });
  };

  const disturbCluster = (amount: number) => {
    if (reducedMotion || amount <= 1) return;
    const strength = Math.min(3.2, .8 + amount * .055);
    states.filter((state) => !state.used && !state.dragging && !state.hovered).forEach((state, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      state.vx += direction * strength * (.2 + (index % 3) * .08);
      state.vy += strength * (.45 + (index % 4) * .08);
    });
    clusterEnergy = Math.max(clusterEnergy, 1);
    requestTick();
  };

  const setPieceContent = (element: HTMLElement, state: PieceState) => {
    if (state.kind !== 'function' || !state.value.endsWith('(')) {
      element.textContent = state.value;
      return;
    }
    const name = document.createElement('span');
    name.className = 'piece-part piece-part--function';
    name.textContent = state.value.slice(0, -1);
    const opening = document.createElement('span');
    opening.className = 'piece-part piece-part--syntax';
    opening.textContent = '(';
    element.append(name, opening);
  };

  const setPosition = (state: PieceState) => {
    const tilt = state.dragging ? state.dragAngle : getBaseTilt(state);
    state.element.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) rotate(${tilt}deg)`;
  };

  const getCollisionDimensions = (state: PieceState) => {
    const angle = Math.abs((state.dragging ? state.dragAngle : getBaseTilt(state)) * Math.PI / 180);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    return {
      width: state.width * cosine + state.height * sine,
      height: state.height * cosine + state.width * sine,
    };
  };

  const measureLoosePiece = (state: PieceState) => {
    const wasHidden = state.element.hidden;
    const previousVisibility = state.element.style.visibility;
    if (wasHidden) {
      state.element.style.visibility = 'hidden';
      state.element.hidden = false;
    }
    const width = state.element.offsetWidth;
    const height = state.element.offsetHeight;
    if (width > 0) state.width = width;
    if (height > 0) state.height = height;
    if (wasHidden) {
      state.element.hidden = true;
      state.element.style.visibility = previousVisibility;
    }
  };

  const packCluster = () => {
    const width = field.getBoundingClientRect().width;
    if (width <= 0) return;
    lastFieldWidth = width;

    const available = states.filter((state) => !state.used);
    available.forEach((state) => measureLoosePiece(state));

    type PackedRow = { states: PieceState[]; width: number; height: number };
    const rows: PackedRow[] = [];
    let row: PackedRow = { states: [], width: 0, height: 0 };
    const usableWidth = Math.max(80, width - CLUSTER_PAD_X * 2);

    available.forEach((state) => {
      const proposed = row.states.length
        ? row.width + CLUSTER_MIN_GAP_X + state.width
        : state.width;
      if (row.states.length && proposed > usableWidth) {
        rows.push(row);
        row = { states: [], width: 0, height: 0 };
      }
      row.width = row.states.length
        ? row.width + CLUSTER_MIN_GAP_X + state.width
        : state.width;
      row.height = Math.max(row.height, state.height);
      row.states.push(state);
    });
    if (row.states.length) rows.push(row);

    clusterBreathingInset = getClusterBreathingInset(available.length, rows.length);
    let y = CLUSTER_PAD_Y + clusterBreathingInset;
    rows.forEach((packedRow, rowIndex) => {
      const totalPieceWidth = packedRow.states.reduce((sum, state) => sum + state.width, 0);
      const isLastRow = rowIndex === rows.length - 1;
      const flexibleGap = packedRow.states.length > 1
        ? clamp((usableWidth - totalPieceWidth) / (packedRow.states.length - 1), CLUSTER_MIN_GAP_X, CLUSTER_MAX_GAP_X)
        : 0;
      const gap = isLastRow ? Math.min(flexibleGap, 14) : flexibleGap;
      const rowWidth = totalPieceWidth + gap * Math.max(0, packedRow.states.length - 1);
      let x = Math.max(CLUSTER_PAD_X, (width - rowWidth) / 2);

      packedRow.states.forEach((state) => {
        const stateIndex = states.indexOf(state);
        const jitterX = ((stateIndex * 7 + rowIndex * 3) % 5) - 2;
        const jitterY = ((stateIndex * 5 + rowIndex * 2) % 3) - 1;
        state.x = clamp(x + jitterX, 0, Math.max(0, width - state.width));
        state.y = Math.max(0, y + jitterY);
        state.homeX = state.x;
        state.homeY = state.y;
        state.vx = 0;
        state.vy = 0;
        setPosition(state);
        x += state.width + gap;
      });
      y += packedRow.height + CLUSTER_GAP_Y;
    });

    clusterNaturalHeight = Math.max(18, Math.ceil(y - CLUSTER_GAP_Y + CLUSTER_PAD_Y + clusterBreathingInset));
    cluster.style.setProperty('--cluster-height', `${clusterNaturalHeight + clusterHelpOccupiedDepth}px`);
    updateStrings();
  };

  const createFormulaMarker = () => {
    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = 'formula-token formula-token--marker chalk-piece--syntax';
    marker.dataset.formulaMarker = '';
    marker.setAttribute('aria-label', 'Required formula equals sign. Formulas always begin with equals and this marker cannot be removed.');
    marker.setAttribute('aria-describedby', 'formula-required-marker-help');
    if (formulaMarkerWarningActive) marker.dataset.markerWarning = 'true';

    marker.append(document.createTextNode('='));
    const tooltip = document.createElement('span');
    tooltip.className = 'formula-token__marker-tooltip';
    tooltip.id = 'formula-required-marker-help';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.textContent = 'Formulas always begin with =. This first sign stays in place.';
    marker.append(tooltip);
    return marker;
  };

  const setFormulaMarkerWarning = (active: boolean) => {
    formulaMarkerWarningActive = active;
    if (active) {
      formulaEntry.dataset.markerWarning = 'true';
      inputCell.dataset.markerWarning = 'true';
    } else {
      delete formulaEntry.dataset.markerWarning;
      delete inputCell.dataset.markerWarning;
    }

    const marker = formulaOutput.querySelector<HTMLButtonElement>('[data-formula-marker]');
    if (!marker) return;
    if (active) marker.dataset.markerWarning = 'true';
    else delete marker.dataset.markerWarning;
  };

  const showFormulaMarkerWarning = () => {
    if (formulaMarkerWarningTimer) window.clearTimeout(formulaMarkerWarningTimer);
    setFormulaMarkerWarning(true);
    formulaMarkerWarningTimer = window.setTimeout(() => {
      formulaMarkerWarningTimer = 0;
      setFormulaMarkerWarning(false);
    }, FORMULA_MARKER_WARNING_MS);
  };

  const syncInputHeight = () => {
    const previousTarget = lastAnswerHeight;
    const inputStyle = window.getComputedStyle(inputCell);
    const minHeight = Number.parseFloat(inputStyle.minHeight) || 0;
    const verticalChrome =
      (Number.parseFloat(inputStyle.paddingTop) || 0) +
      (Number.parseFloat(inputStyle.paddingBottom) || 0) +
      (Number.parseFloat(inputStyle.borderTopWidth) || 0) +
      (Number.parseFloat(inputStyle.borderBottomWidth) || 0);
    // Measure the flex rows themselves. scrollHeight also includes the absolutely
    // positioned marker tooltip, which can make an otherwise single-row answer
    // cell appear much taller than its formula tokens.
    const formulaRowsHeight = formulaOutput.getBoundingClientRect().height;
    const nextHeight = Math.max(minHeight, Math.ceil(formulaRowsHeight + verticalChrome));
    if (!inputCell.style.height) {
      inputCell.style.height = `${Math.max(minHeight, Math.round(inputCell.getBoundingClientRect().height))}px`;
      void inputCell.offsetHeight;
    }
    inputCell.style.height = `${nextHeight}px`;
    if (nextHeight > previousTarget + 1) disturbCluster(nextHeight - previousTarget);
    lastAnswerHeight = nextHeight;
  };

  const renderFormula = () => {
    formulaOutput.replaceChildren(createFormulaMarker());
    placedIds.forEach((id) => {
      const state = states.find((piece) => piece.id === id);
      if (!state) return;
      const token = document.createElement('button');
      token.type = 'button';
      token.className = `formula-token chalk-piece--${state.kind}`;
      token.dataset.placedId = state.id;
      setPieceContent(token, state);
      token.setAttribute('aria-label', `Remove ${state.value}`);
      formulaOutput.append(token);
    });
    const preview = states.find((piece) => piece.id === previewId && !piece.used);
    if (preview) {
      const ghost = document.createElement('span');
      ghost.className = 'formula-token formula-token--preview';
      setPieceContent(ghost, preview);
      ghost.setAttribute('aria-hidden', 'true');
      const insertionPoint = Math.max(0, Math.min(previewIndex ?? placedIds.length, placedIds.length));
      const placedTokens = Array.from(formulaOutput.querySelectorAll<HTMLElement>('[data-placed-id]'));
      formulaOutput.insertBefore(ghost, placedTokens[insertionPoint] ?? null);
    }
    placeholder.hidden = placedIds.length > 0 || Boolean(preview);
    const assembledFormula = placedIds.map((id) => states.find((piece) => piece.id === id)?.value).join('');
    inputCell.setAttribute('aria-label', `Formula answer for total units sold in East, selected. =${assembledFormula || ' empty'}`);
    syncInputHeight();
    scheduleClusterHeight();
  };

  const placePiece = (state: PieceState, index = placedIds.length) => {
    if (!selectedCell || state.used) return;
    releaseHoverLock(state);
    previewId = null;
    previewIndex = null;
    state.used = true;
    state.element.hidden = true;
    placedIds.splice(Math.max(0, Math.min(index, placedIds.length)), 0, state.id);
    clearEmptySubmitWarning();
    renderFormula();
    clearStatus();
  };

  const previewPiece = (state: PieceState | null, index = placedIds.length) => {
    previewId = state && !state.used ? state.id : null;
    previewIndex = previewId ? Math.max(0, Math.min(index, placedIds.length)) : null;
    states.forEach((piece) => {
      piece.element.dataset.preview = String(piece.id === previewId);
    });
    renderFormula();
  };

  const returnPiece = (id: string) => {
    const state = states.find((piece) => piece.id === id);
    const index = placedIds.indexOf(id);
    if (!state || index < 0) return;
    placedIds.splice(index, 1);
    const bounds = field.getBoundingClientRect();
    state.used = false;
    state.dragging = false;
    state.dragAngle = getBaseTilt(state);
    state.x = clamp(state.x, 0, Math.max(0, bounds.width - state.width));
    state.y = clamp(state.y, 0, Math.max(0, bounds.height - state.height));
    state.element.hidden = false;
    state.vx = (Math.random() - .5) * .5;
    state.vy = 0;
    setPosition(state);
    renderFormula();
    scheduleClusterHeight();
    clearStatus();
    clusterEnergy = Math.max(clusterEnergy, .9);
    requestTick();
  };

  const returnPlacedPieceAtDrop = (pointer: PlacedPointer, clientX: number, clientY: number, onSettled: () => void) => {
    const { state, ghost } = pointer;
    const index = placedIds.indexOf(state.id);
    if (index < 0) {
      onSettled();
      return;
    }

    const finalGhostWidth = pointer.width * pointer.looseScale;
    const finalGhostHeight = pointer.height * pointer.looseScale;
    const finalGhostTarget = getViewportDragTarget(
      state,
      finalGhostWidth,
      finalGhostHeight,
      clientX,
      clientY,
      pointer.grabRatioX * finalGhostWidth,
      pointer.grabRatioY * finalGhostHeight,
    );
    if (!reducedMotion) {
      ghost.style.transition = 'left 90ms cubic-bezier(.2,.8,.25,1), top 90ms cubic-bezier(.2,.8,.25,1), transform 90ms cubic-bezier(.2,.8,.25,1), filter 120ms ease, box-shadow 120ms ease';
    }
    ghost.style.left = `${finalGhostTarget.x}px`;
    ghost.style.top = `${finalGhostTarget.y}px`;
    ghost.style.transform = `rotate(${finalGhostTarget.angle}deg) scale(${pointer.looseScale})`;

    placedIds.splice(index, 1);
    previewId = null;
    previewIndex = null;
    state.used = true;
    state.dragging = false;
    state.element.hidden = true;
    state.vx = 0;
    state.vy = 0;
    renderFormula();
    clearStatus();

    requestAnimationFrame(() => {
      const fieldBounds = field.getBoundingClientRect();
      const canvasBounds = getCanvasDragBounds();
      const minX = canvasBounds.left - fieldBounds.left;
      const maxX = canvasBounds.right - fieldBounds.left - state.width;
      const minY = canvasBounds.top - fieldBounds.top;
      const maxY = canvasBounds.bottom - fieldBounds.top - state.height;
      const rawX = clientX - fieldBounds.left - pointer.grabRatioX * state.width;
      const rawY = clientY - fieldBounds.top - pointer.grabRatioY * state.height;

      state.x = clamp(rawX, minX, maxX);
      state.y = clamp(rawY, minY, maxY);
      state.dragAngle = getBaseTilt(state);
      state.used = false;
      state.element.hidden = false;
      state.vx = 0;
      state.vy = 0;
      setPosition(state);
      pushPiecesFromBody(fieldBounds.left + state.x, fieldBounds.top + state.y, state.width, state.height);
      syncClusterHeight();
      updateStrings();
      onSettled();
      clusterEnergy = Math.max(clusterEnergy, 1);
      requestTick();
    });
  };

  const pointInside = (x: number, y: number, bounds: DOMRect, margin = 0) => (
    x >= bounds.left - margin
    && x <= bounds.right + margin
    && y >= bounds.top - margin
    && y <= bounds.bottom + margin
  );

  const findReorderIndex = (x: number, y: number, draggedId: string) => {
    const tokens = Array.from(formulaOutput.querySelectorAll<HTMLButtonElement>('[data-placed-id]'))
      .filter((token) => token.dataset.placedId !== draggedId && !token.hidden);
    for (let index = 0; index < tokens.length; index += 1) {
      const bounds = tokens[index].getBoundingClientRect();
      if (y < bounds.top - 5) return index;
      const withinRow = y <= bounds.bottom + 5;
      if (withinRow && x < bounds.left + bounds.width / 2) return index;
    }
    return tokens.length;
  };

  const showReorderPreview = (pointer: PlacedPointer, index: number) => {
    if (pointer.reorderIndex === index && pointer.reorderPreview.isConnected) return;
    pointer.reorderIndex = index;
    pointer.token.hidden = true;
    const remaining = Array.from(formulaOutput.querySelectorAll<HTMLButtonElement>('[data-placed-id]'))
      .filter((token) => token.dataset.placedId !== pointer.state.id && !token.hidden);
    formulaOutput.insertBefore(pointer.reorderPreview, remaining[index] ?? null);
    syncInputHeight();
  };

  const hideReorderPreview = (pointer: PlacedPointer) => {
    pointer.reorderIndex = null;
    pointer.reorderPreview.remove();
    pointer.token.hidden = false;
    syncInputHeight();
  };

  type NeighbourLink = {
    state: PieceState;
    neighbour: PieceState;
    dx: number;
    dy: number;
    distance: number;
    edgeGap: number;
  };

  const getNeighbourLink = (state: PieceState, active: PieceState[]): NeighbourLink | null => {
    let best: NeighbourLink | null = null;
    const stateCentreX = state.x + state.width / 2;
    const stateCentreY = state.y + state.height / 2;

    active.forEach((candidate) => {
      if (candidate === state) return;
      const dx = (candidate.x + candidate.width / 2) - stateCentreX;
      const dy = (candidate.y + candidate.height / 2) - stateCentreY;
      const distance = Math.max(.001, Math.hypot(dx, dy));
      const unitX = Math.abs(dx) / distance;
      const unitY = Math.abs(dy) / distance;
      const stateExtent = unitX * state.width / 2 + unitY * state.height / 2;
      const candidateExtent = unitX * candidate.width / 2 + unitY * candidate.height / 2;
      const edgeGap = distance - stateExtent - candidateExtent;
      if (!best || edgeGap < best.edgeGap || (Math.abs(edgeGap - best.edgeGap) < .5 && distance < best.distance)) {
        best = { state, neighbour: candidate, dx, dy, distance, edgeGap };
      }
    });

    return best;
  };

  const updateStrings = () => {
    const active = states.filter((state) => !state.used && !state.dragging);
    strings.replaceChildren();
    const drawn = new Set<string>();

    active.forEach((state) => {
      const link = getNeighbourLink(state, active);
      if (!link) return;
      const key = [state.id, link.neighbour.id].sort().join(':');
      if (drawn.has(key)) return;
      drawn.add(key);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.dataset.link = key;
      line.setAttribute('x1', String(state.x + state.width / 2));
      line.setAttribute('y1', String(state.y + state.height / 2));
      line.setAttribute('x2', String(link.neighbour.x + link.neighbour.width / 2));
      line.setAttribute('y2', String(link.neighbour.y + link.neighbour.height / 2));
      line.style.setProperty('--link-gap', String(Math.max(0, link.edgeGap)));
      strings.append(line);
    });
  };

  const clearAnswerDropState = () => {
    delete inputCell.dataset.dropActive;
  };

  const updateClusterDragPreview = (pointer: ClusterPointer) => {
    if (!pointer.moved || !stateOverAnswer(pointer.state)) {
      if (previewId === pointer.state.id) previewPiece(null);
      clearAnswerDropState();
      return;
    }
    const fieldBounds = field.getBoundingClientRect();
    const centreX = fieldBounds.left + pointer.state.x + pointer.state.width / 2;
    const centreY = fieldBounds.top + pointer.state.y + pointer.state.height / 2;
    const index = findReorderIndex(centreX, centreY, '');
    if (previewId !== pointer.state.id || previewIndex !== index) previewPiece(pointer.state, index);
    inputCell.dataset.dropActive = 'true';
  };

  const updatePlacedDragZone = (pointer: PlacedPointer) => {
    const answerBounds = inputCell.getBoundingClientRect();
    const projectedX = pointer.pointerX - pointer.grabRatioX * pointer.width;
    const projectedY = pointer.pointerY - pointer.grabRatioY * pointer.height;
    const centreX = projectedX + pointer.width / 2;
    const centreY = projectedY + pointer.height / 2;
    const overlap = overlapRatio(projectedX, projectedY, pointer.width, pointer.height, answerBounds);
    const overAnswer = pointer.zone === 'answer'
      ? pointInside(centreX, centreY, answerBounds) || overlap >= .12
      : pointInside(centreX, centreY, answerBounds, 5) || overlap >= .32;
    const nextZone = overAnswer ? 'answer' : 'cluster';
    if (nextZone === pointer.zone) return;
    pointer.zone = nextZone;
    pointer.targetScale = nextZone === 'answer' ? 1 : pointer.looseScale;
    pointer.ghost.dataset.dragZone = nextZone;
  };

  const updatePlacedDragInteraction = (pointer: PlacedPointer) => {
    if (!pointer.moved) return;
    const visualWidth = pointer.width * pointer.scale;
    const visualHeight = pointer.height * pointer.scale;
    const centreX = pointer.x + visualWidth / 2;
    const centreY = pointer.y + visualHeight / 2;
    if (pointer.zone === 'answer') {
      const index = findReorderIndex(centreX, centreY, pointer.state.id);
      showReorderPreview(pointer, index);
      inputCell.dataset.dropActive = 'true';
    } else {
      if (pointer.reorderIndex !== null) hideReorderPreview(pointer);
      clearAnswerDropState();
    }
  };

  const angularDelta = (from: number, to: number) => ((to - from + 540) % 360) - 180;

  const advanceClusterPointer = (pointer: ClusterPointer) => {
    const state = pointer.state;
    const dx = pointer.targetX - state.x;
    const dy = pointer.targetY - state.y;
    const distance = Math.hypot(dx, dy);
    const follow = distance > 220 ? .2 : .48;
    state.vx = state.vx * .34 + dx * follow;
    state.vy = state.vy * .34 + dy * follow;
    const speed = Math.hypot(state.vx, state.vy);
    const maxSpeed = distance > 220 ? 72 : Math.max(18, Math.min(54, distance * .9));
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      state.vx *= scale;
      state.vy *= scale;
    }
    state.x += state.vx;
    state.y += state.vy;

    const fieldBounds = field.getBoundingClientRect();
    const canvasBounds = getCanvasDragBounds();
    const minX = canvasBounds.left - fieldBounds.left;
    const maxX = canvasBounds.right - fieldBounds.left - state.width;
    const minY = canvasBounds.top - fieldBounds.top;
    const maxY = canvasBounds.bottom - fieldBounds.top - state.height;
    state.x = clamp(state.x, minX, maxX);
    state.y = clamp(state.y, minY, maxY);
    state.dragAngle += angularDelta(state.dragAngle, pointer.targetAngle) * .28;
    if (distance < .35) {
      state.x = pointer.targetX;
      state.y = pointer.targetY;
    }
    setPosition(state);
    updateClusterDragPreview(pointer);
  };

  const advancePlacedPointer = (pointer: PlacedPointer) => {
    if (!pointer.moved) return;
    pointer.scale += (pointer.targetScale - pointer.scale) * .36;
    if (Math.abs(pointer.targetScale - pointer.scale) < .006) pointer.scale = pointer.targetScale;

    const visualWidth = pointer.width * pointer.scale;
    const visualHeight = pointer.height * pointer.scale;
    const target = getViewportDragTarget(
      pointer.state,
      visualWidth,
      visualHeight,
      pointer.pointerX,
      pointer.pointerY,
      pointer.grabRatioX * visualWidth,
      pointer.grabRatioY * visualHeight,
    );
    pointer.targetX = target.x;
    pointer.targetY = target.y;
    pointer.targetAngle = target.angle;
    pointer.edge = target.edge;
    setEdgeContact(pointer.ghost, pointer.edge);

    const dx = pointer.targetX - pointer.x;
    const dy = pointer.targetY - pointer.y;
    const distance = Math.hypot(dx, dy);
    const follow = distance > 220 ? .2 : .48;
    pointer.vx = pointer.vx * .34 + dx * follow;
    pointer.vy = pointer.vy * .34 + dy * follow;
    const speed = Math.hypot(pointer.vx, pointer.vy);
    const maxSpeed = distance > 220 ? 72 : Math.max(18, Math.min(54, distance * .9));
    if (speed > maxSpeed) {
      const velocityScale = maxSpeed / speed;
      pointer.vx *= velocityScale;
      pointer.vy *= velocityScale;
    }
    pointer.x += pointer.vx;
    pointer.y += pointer.vy;

    const bounds = getCanvasDragBounds();
    pointer.x = clamp(pointer.x, bounds.left, bounds.right - visualWidth);
    pointer.y = clamp(pointer.y, bounds.top, bounds.bottom - visualHeight);
    pointer.angle += angularDelta(pointer.angle, pointer.targetAngle) * .28;
    if (distance < .35) {
      pointer.x = pointer.targetX;
      pointer.y = pointer.targetY;
    }
    pointer.ghost.style.left = `${pointer.x}px`;
    pointer.ghost.style.top = `${pointer.y}px`;
    pointer.ghost.style.transform = `rotate(${pointer.angle}deg) scale(${pointer.scale})`;
    updatePlacedDragInteraction(pointer);
  };

  const pushPiecesFromBody = (left: number, top: number, width: number, height: number) => {
    const fieldBounds = field.getBoundingClientRect();
    const bodyX = left - fieldBounds.left;
    const bodyY = top - fieldBounds.top;
    let pushed = false;
    states.filter((state) => !state.used && !state.dragging && !state.hovered).forEach((state) => {
      const dx = (state.x + state.width / 2) - (bodyX + width / 2);
      const dy = (state.y + state.height / 2) - (bodyY + height / 2);
      const overlapX = (state.width + width) / 2 + 10 - Math.abs(dx);
      const overlapY = (state.height + height) / 2 + 10 - Math.abs(dy);
      if (overlapX <= 0 || overlapY <= 0) return;
      const force = .055;
      if (overlapX < overlapY) {
        state.vx += overlapX * force * (dx >= 0 ? 1 : -1);
      } else {
        state.vy += overlapY * force * (dy >= 0 ? 1 : -1);
      }
      pushed = true;
    });
    if (pushed) clusterEnergy = Math.max(clusterEnergy, .9);
  };

  const resolveClusterCollisions = (active: PieceState[], fieldWidth: number, fieldHeight: number) => {
    const collisionGap = CLUSTER_COLLISION_GAP;
    const iterations = 10;
    let hadCorrections = false;

    for (let iteration = 0; iteration < iterations; iteration += 1) {
      let corrected = false;

      for (let first = 0; first < active.length; first += 1) {
        for (let second = first + 1; second < active.length; second += 1) {
          const a = active[first];
          const b = active[second];
          const aPinned = a.dragging || a.hovered;
          const bPinned = b.dragging || b.hovered;
          if (aPinned && bPinned) continue;

          const dx = (b.x + b.width / 2) - (a.x + a.width / 2);
          const dy = (b.y + b.height / 2) - (a.y + a.height / 2);
          const aCollision = getCollisionDimensions(a);
          const bCollision = getCollisionDimensions(b);
          const overlapX = (aCollision.width + bCollision.width) / 2 + collisionGap - Math.abs(dx);
          const overlapY = (aCollision.height + bCollision.height) / 2 + collisionGap - Math.abs(dy);
          if (overlapX <= 0 || overlapY <= 0) continue;

          corrected = true;
          hadCorrections = true;
          const separateX = overlapX <= overlapY;
          const direction = separateX ? (dx >= 0 ? 1 : -1) : (dy >= 0 ? 1 : -1);
          const penetration = (separateX ? overlapX : overlapY) + .25;
          const movable = Number(!aPinned) + Number(!bPinned);
          if (!movable) continue;
          const aShare = aPinned ? 0 : penetration / movable;
          const bShare = bPinned ? 0 : penetration / movable;

          if (separateX) {
            a.x -= aShare * direction;
            b.x += bShare * direction;
          } else {
            a.y -= aShare * direction;
            b.y += bShare * direction;
          }

          if (!aPinned) {
            a.x = clamp(a.x, 0, Math.max(0, fieldWidth - a.width));
            a.y = clamp(a.y, 0, Math.max(0, fieldHeight - a.height));
          }
          if (!bPinned) {
            b.x = clamp(b.x, 0, Math.max(0, fieldWidth - b.width));
            b.y = clamp(b.y, 0, Math.max(0, fieldHeight - b.height));
          }
        }
      }

      if (!corrected) break;
    }

    return hadCorrections;
  };

  const clusterHasOverlap = (active: PieceState[]) => {
    for (let first = 0; first < active.length; first += 1) {
      for (let second = first + 1; second < active.length; second += 1) {
        const a = active[first];
        const b = active[second];
        const dx = (b.x + b.width / 2) - (a.x + a.width / 2);
        const dy = (b.y + b.height / 2) - (a.y + a.height / 2);
        const aCollision = getCollisionDimensions(a);
        const bCollision = getCollisionDimensions(b);
        const overlapX = (aCollision.width + bCollision.width) / 2 + CLUSTER_COLLISION_GAP - Math.abs(dx);
        const overlapY = (aCollision.height + bCollision.height) / 2 + CLUSTER_COLLISION_GAP - Math.abs(dy);
        if (overlapX > .2 && overlapY > .2) return true;
      }
    }
    return false;
  };

  const getPinnedHelpObstacle = (fieldBounds: DOMRect) => {
    if (!helpPanelPinned || helpPanel.hidden) return null;
    const panelBounds = helpPanel.getBoundingClientRect();
    const narrow = helpPanel.dataset.layout === 'vertical';
    return {
      left: panelBounds.left - fieldBounds.left - HELP_CLUSTER_OBSTACLE_GAP,
      right: panelBounds.right - fieldBounds.left + HELP_CLUSTER_OBSTACLE_GAP,
      top: panelBounds.top - fieldBounds.top - HELP_CLUSTER_OBSTACLE_GAP,
      bottom: panelBounds.bottom - fieldBounds.top + HELP_CLUSTER_OBSTACLE_GAP,
      narrow,
    };
  };

  const tick = (time: number) => {
    animationFrame = 0;
    if (!visible || reducedMotion) return;
    const bounds = field.getBoundingClientRect();
    const active = states.filter((state) => !state.used);
    const helpObstacle = getPinnedHelpObstacle(bounds);
    if (helpObstacle) {
      helpClusterRecoveryUntil = 0;
      helpClusterRecoveryHardStop = 0;
    }
    let helpRecoveryStrength = 0;
    if (!helpObstacle && helpClusterRecoveryUntil) {
      if (time < helpClusterRecoveryUntil) {
        helpRecoveryStrength = clamp((helpClusterRecoveryUntil - time) / HELP_CLUSTER_RECOVERY_MS, 0, 1);
      } else {
        const movable = active.filter((state) => !state.dragging && !state.hovered);
        const canKeepSettling = helpClusterRecoveryHardStop > time && clusterHasOverlap(movable);
        if (canKeepSettling) {
          helpRecoveryStrength = .24;
        } else {
          helpClusterRecoveryUntil = 0;
          helpClusterRecoveryHardStop = 0;
        }
      }
    }
    const centreX = helpObstacle && !helpObstacle.narrow
      ? Math.max(CLUSTER_PAD_X, Math.min(bounds.width / 2, helpObstacle.left / 2))
      : bounds.width / 2;
    const narrowFreeTop = helpObstacle?.narrow
      ? Math.max(CLUSTER_PAD_Y, helpObstacle.bottom)
      : CLUSTER_PAD_Y;
    const centreY = helpObstacle?.narrow
      ? clamp(narrowFreeTop + (bounds.height - narrowFreeTop) / 2, bounds.height / 2, Math.max(bounds.height / 2, bounds.height - CLUSTER_PAD_Y))
      : bounds.height / 2;

    // Preserve the current constrained drag/answer mechanics, but use the live
    // build's original loose-label physics for every other piece.
    syncHoveredPieceToViewport(bounds);
    if (activePointer?.started) advanceClusterPointer(activePointer);
    if (activePlacedPointer) {
      advancePlacedPointer(activePlacedPointer);
      if (activePlacedPointer.moved) {
        pushPiecesFromBody(
          activePlacedPointer.x,
          activePlacedPointer.y,
          activePlacedPointer.width * activePlacedPointer.scale,
          activePlacedPointer.height * activePlacedPointer.scale,
        );
      }
    }

    // Original live movement model: a weak centre pull plus tiny organic drift.
    // Hovered pieces are the only current-version exception because they are
    // intentionally pinned to prevent answer-wrap hover flicker.
    active.forEach((state, index) => {
      if (state.dragging || state.hovered) return;
      const stateCentreX = state.x + state.width / 2;
      const stateCentreY = state.y + state.height / 2;
      const recoveryPullX = HELP_CLUSTER_RECOVERY_PULL_X * helpRecoveryStrength;
      const recoveryPullY = HELP_CLUSTER_RECOVERY_PULL_Y * helpRecoveryStrength;
      const recoveryBounce = Math.sin(time / 125 + index * 1.45) * .018 * helpRecoveryStrength;
      state.vx += (centreX - stateCentreX) * (CLUSTER_GRAVITY_PULL + recoveryPullX)
        + Math.sin(time / 1700 + index * 1.9) * CLUSTER_WANDER_FORCE;
      state.vy += (centreY - stateCentreY) * (CLUSTER_GRAVITY_PULL + recoveryPullY)
        + Math.cos(time / 1900 + index * 1.3) * CLUSTER_WANDER_FORCE
        + recoveryBounce;

      if (!helpObstacle) return;
      const collision = getCollisionDimensions(state);
      const left = stateCentreX - collision.width / 2;
      const right = stateCentreX + collision.width / 2;
      const top = stateCentreY - collision.height / 2;
      const bottom = stateCentreY + collision.height / 2;
      const overlapsVertically = bottom > helpObstacle.top && top < helpObstacle.bottom;
      const overlapsHorizontally = right > helpObstacle.left && left < helpObstacle.right;
      if (!overlapsVertically || !overlapsHorizontally) return;
      if (helpObstacle.narrow) {
        const penetration = Math.max(0, helpObstacle.bottom - top);
        state.vy += Math.min(4.8, .55 + penetration * .075);
        state.vx += Math.sin(index * 1.7 + time / 280) * .035;
        return;
      }
      const penetration = Math.max(0, right - helpObstacle.left);
      state.vx -= Math.min(4.8, .55 + penetration * .075);
      state.vy += Math.sin(index * 1.7 + time / 280) * .035;
    });

    // Normal play keeps the reviewed soft collision response. While pinned Help
    // compresses the cluster, and again during the temporary recovery phase,
    // overlapping labels receive a stronger room-aware impulse so they can
    // shuffle into available gaps instead of settling on top of one another.
    const overlapReliefStrength = helpObstacle
      ? HELP_CLUSTER_OVERLAP_FORCE_PINNED
      : helpRecoveryStrength > 0
        ? HELP_CLUSTER_OVERLAP_FORCE_RECOVERY * (.7 + helpRecoveryStrength * .3)
        : 0;
    for (let first = 0; first < active.length; first += 1) {
      for (let second = first + 1; second < active.length; second += 1) {
        const a = active[first];
        const b = active[second];
        const aPinned = a.dragging || a.hovered;
        const bPinned = b.dragging || b.hovered;
        if (aPinned && bPinned) continue;
        const aCollision = overlapReliefStrength > 0 ? getCollisionDimensions(a) : { width: a.width, height: a.height };
        const bCollision = overlapReliefStrength > 0 ? getCollisionDimensions(b) : { width: b.width, height: b.height };
        const dx = (b.x + b.width / 2) - (a.x + a.width / 2);
        const dy = (b.y + b.height / 2) - (a.y + a.height / 2);
        const overlapX = (aCollision.width + bCollision.width) / 2 + CLUSTER_COLLISION_GAP - Math.abs(dx);
        const overlapY = (aCollision.height + bCollision.height) / 2 + CLUSTER_COLLISION_GAP - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;

        let separateX = overlapX < overlapY;
        if (overlapReliefStrength > 0) {
          const xDirection = dx >= 0 ? 1 : -1;
          const yDirection = dy >= 0 ? 1 : -1;
          const rightRoom = (state: PieceState, collision: { width: number; height: number }) => {
            let rightLimit = bounds.width;
            if (helpObstacle && !helpObstacle.narrow) {
              const centreY = state.y + state.height / 2;
              const top = centreY - collision.height / 2;
              const bottom = centreY + collision.height / 2;
              if (bottom > helpObstacle.top && top < helpObstacle.bottom) rightLimit = Math.min(rightLimit, helpObstacle.left);
            }
            return Math.max(0, rightLimit - (state.x + state.width));
          };
          const topRoom = (state: PieceState, collision: { width: number; height: number }) => {
            let topLimit = 0;
            if (helpObstacle?.narrow) {
              const centreX = state.x + state.width / 2;
              const left = centreX - collision.width / 2;
              const right = centreX + collision.width / 2;
              if (right > helpObstacle.left && left < helpObstacle.right) topLimit = Math.max(topLimit, helpObstacle.bottom);
            }
            return Math.max(0, state.y - topLimit);
          };
          const aRoomX = xDirection > 0 ? a.x : rightRoom(a, aCollision);
          const bRoomX = xDirection > 0 ? rightRoom(b, bCollision) : b.x;
          const aRoomY = yDirection > 0 ? topRoom(a, aCollision) : bounds.height - (a.y + a.height);
          const bRoomY = yDirection > 0 ? bounds.height - (b.y + b.height) : topRoom(b, bCollision);
          const roomX = Math.max(0, aRoomX) + Math.max(0, bRoomX);
          const roomY = Math.max(0, aRoomY) + Math.max(0, bRoomY);
          const xCost = overlapX / Math.max(8, roomX);
          const yCost = overlapY / Math.max(8, roomY);
          separateX = xCost <= yCost;
        }

        const force = overlapReliefStrength || .035;
        const pairDirection = (first + second) % 2 === 0 ? 1 : -1;
        if (separateX) {
          const direction = dx >= 0 ? 1 : -1;
          if (!aPinned) a.vx -= overlapX * force * direction;
          if (!bPinned) b.vx += overlapX * force * direction;
          if (overlapReliefStrength > 0) {
            const shuffle = HELP_CLUSTER_OVERLAP_SHUFFLE * (1 + Math.min(1.5, overlapY / 18));
            if (!aPinned) a.vy -= shuffle * pairDirection;
            if (!bPinned) b.vy += shuffle * pairDirection;
          }
        } else {
          const direction = dy >= 0 ? 1 : -1;
          if (!aPinned) a.vy -= overlapY * force * direction;
          if (!bPinned) b.vy += overlapY * force * direction;
          if (overlapReliefStrength > 0) {
            const shuffle = HELP_CLUSTER_OVERLAP_SHUFFLE * .65 * (1 + Math.min(1.5, overlapX / 22));
            if (!aPinned) a.vx -= shuffle * pairDirection;
            if (!bPinned) b.vx += shuffle * pairDirection;
          }
        }
      }
    }

    // Original live damping and boundary clamp. Continuous centre gravity means
    // displaced labels glide back toward the group instead of targeting a saved
    // home coordinate.
    active.forEach((state) => {
      if (state.dragging || state.hovered) return;
      const damping = helpRecoveryStrength > 0 ? HELP_CLUSTER_RECOVERY_DAMPING : CLUSTER_DAMPING;
      state.vx *= damping;
      state.vy *= damping;
      state.x = Math.max(0, Math.min(bounds.width - state.width, state.x + state.vx));
      state.y = Math.max(0, Math.min(bounds.height - state.height, state.y + state.vy));
      setPosition(state);
    });

    frame += 1;
    if (frame % 3 === 0) updateStrings();
    animationFrame = window.requestAnimationFrame(tick);
  };

  const requestTick = () => {
    if (!animationFrame && visible && !reducedMotion) animationFrame = window.requestAnimationFrame(tick);
  };

  const beginClusterDrag = (pointer: ClusterPointer) => {
    if (pointer.started) return;
    const state = pointer.state;
    pointer.started = true;
    state.dragging = true;
    state.dragAngle = getBaseTilt(state);
    state.vx = 0;
    state.vy = 0;
    state.element.dataset.dragging = 'true';
    cluster.dataset.dragging = 'true';
    try { state.element.setPointerCapture(pointer.id); } catch { /* pointer capture is best effort */ }
    requestTick();
  };

  const releaseHoverForViewportScroll = () => {
    if (!hoverLock) return;
    const releasedId = hoverLock.state.id;
    releaseHoverLock();
    if (previewId === releasedId) previewPiece(null);
  };

  field.addEventListener('wheel', releaseHoverForViewportScroll, { passive: true });
  window.addEventListener('scroll', releaseHoverForViewportScroll, { passive: true });

  field.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-piece-id]');
    if (!button) return;
    if (suppressClickId === button.dataset.pieceId) return;
    const state = states.find((piece) => piece.id === button.dataset.pieceId);
    if (state) placePiece(state);
  });

  field.addEventListener('pointerover', (event) => {
    if (event.pointerType === 'touch' || activePointer || activePlacedPointer) return;
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-piece-id]');
    const state = states.find((piece) => piece.id === button?.dataset.pieceId);
    if (!state) return;
    pinHoveredPiece(state);
    previewPiece(state);
  });

  field.addEventListener('pointerout', (event) => {
    if (event.pointerType === 'touch') return;
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-piece-id]');
    if (!button || button.contains(event.relatedTarget as Node | null) || activePointer) return;
    const state = states.find((piece) => piece.id === button.dataset.pieceId);
    if (!state) return;

    // Keep the active hover anchored to the original, non-moving hit area.
    // The visual piece can glow/lift or be compensated for answer-layout movement
    // without moving the pointer outside the interaction target.
    if (hoverLock?.state === state && pointerInsideHoverLock(event.clientX, event.clientY)) return;

    releaseHoverLock(state);
    if (previewId === button.dataset.pieceId) previewPiece(null);
  });

  field.addEventListener('focusin', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-piece-id]');
    const state = states.find((piece) => piece.id === button?.dataset.pieceId);
    if (state) previewPiece(state);
  });

  field.addEventListener('focusout', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-piece-id]');
    if (button && previewId === button.dataset.pieceId) previewPiece(null);
  });

  field.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    if (event.pointerType === 'touch' && !touchModeEnabled) return;

    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-piece-id]');
    if (!button || activePointer || activePlacedPointer) return;
    const state = states.find((piece) => piece.id === button.dataset.pieceId);
    if (!state) return;

    releaseHoverLock(state);
    previewPiece(null);
    const bounds = button.getBoundingClientRect();
    activePointer = {
      state,
      id: event.pointerId,
      started: false,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      grabOffsetX: event.clientX - bounds.left,
      grabOffsetY: event.clientY - bounds.top,
      targetX: state.x,
      targetY: state.y,
      targetAngle: getBaseTilt(state),
      edge: null,
    };

    // Loose labels are direct-manipulation controls in Touch Mode. Empty cluster space
    // remains available for native page panning, while a touched label grabs at once.
    event.preventDefault();
    beginClusterDrag(activePointer);
  });

  document.addEventListener('pointermove', (event) => {
    if (hoverLock && !activePointer && !activePlacedPointer && !pointerInsideHoverLock(event.clientX, event.clientY)) {
      const releasedId = hoverLock.state.id;
      releaseHoverLock();
      if (previewId === releasedId) previewPiece(null);
    }

    if (activePointer && activePointer.id === event.pointerId) {
      const pointer = activePointer;
      const state = pointer.state;
      const deltaX = event.clientX - pointer.startX;
      const deltaY = event.clientY - pointer.startY;
      const distance = Math.hypot(deltaX, deltaY);

      if (!pointer.started) beginClusterDrag(pointer);

      event.preventDefault();
      if (distance > 5) pointer.moved = true;
      const target = getClusterDragTarget(state, event.clientX, event.clientY, pointer.grabOffsetX, pointer.grabOffsetY);
      pointer.targetX = target.x;
      pointer.targetY = target.y;
      pointer.targetAngle = target.angle;
      pointer.edge = target.edge;
      setEdgeContact(state.element, pointer.edge);
      if (reducedMotion) {
        state.x = target.x;
        state.y = target.y;
        state.dragAngle = target.angle;
        setPosition(state);
        updateClusterDragPreview(pointer);
        updateStrings();
      } else {
        requestTick();
      }
      return;
    }

    if (activePlacedPointer && activePlacedPointer.id === event.pointerId) {
      event.preventDefault();
      const pointer = activePlacedPointer;
      const distance = Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY);
      if (distance > 5 && !pointer.moved) {
        pointer.moved = true;
        pointer.ghost.style.visibility = 'visible';
        pointer.token.style.opacity = '.25';
      }
      pointer.pointerX = event.clientX;
      pointer.pointerY = event.clientY;
      updatePlacedDragZone(pointer);
      if (reducedMotion) {
        pointer.scale = pointer.targetScale;
        const visualWidth = pointer.width * pointer.scale;
        const visualHeight = pointer.height * pointer.scale;
        const target = getViewportDragTarget(
          pointer.state,
          visualWidth,
          visualHeight,
          pointer.pointerX,
          pointer.pointerY,
          pointer.grabRatioX * visualWidth,
          pointer.grabRatioY * visualHeight,
        );
        pointer.x = target.x;
        pointer.y = target.y;
        pointer.angle = target.angle;
        pointer.edge = target.edge;
        setEdgeContact(pointer.ghost, pointer.edge);
        pointer.ghost.style.left = `${pointer.x}px`;
        pointer.ghost.style.top = `${pointer.y}px`;
        pointer.ghost.style.transform = `rotate(${pointer.angle}deg) scale(${pointer.scale})`;
        updatePlacedDragInteraction(pointer);
      } else {
        requestTick();
      }
    }
  });

  const finishDrag = (event: PointerEvent, cancelled = false) => {
    if (!activePointer || activePointer.id !== event.pointerId) return;
    const pointer = activePointer;
    const { state, moved } = pointer;
    const gestureCancelled = cancelled;
    const droppedOnCell = !gestureCancelled && moved && stateOverAnswer(state);
    const insertionIndex = previewIndex ?? placedIds.length;
    try {
      if (state.element.hasPointerCapture(event.pointerId)) state.element.releasePointerCapture(event.pointerId);
    } catch { /* capture may already be released */ }
    setEdgeContact(state.element, null);
    clearAnswerDropState();
    state.dragging = false;
    state.dragAngle = getBaseTilt(state);
    delete state.element.dataset.dragging;
    delete cluster.dataset.dragging;

    if (!gestureCancelled && (!moved || droppedOnCell)) {
      placePiece(state, insertionIndex);
    } else {
      previewPiece(null);
      if (moved && !gestureCancelled) {
        state.vx = 0;
        state.vy = 0;
        syncClusterHeight();
      }
      if (!state.used) setPosition(state);
    }

    suppressClickId = !cancelled ? state.id : null;
    window.setTimeout(() => { suppressClickId = null; }, 0);
    activePointer = null;
    requestTick();
  };

  document.addEventListener('pointerup', (event) => finishDrag(event));
  document.addEventListener('pointercancel', (event) => finishDrag(event, true));

  formulaOutput.addEventListener('pointerdown', (event) => {
    const marker = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-formula-marker]');
    if (!marker) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showFormulaMarkerWarning();
  });

  formulaOutput.addEventListener('click', (event) => {
    const marker = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-formula-marker]');
    if (!marker) return;
    event.preventDefault();
    event.stopPropagation();
    showFormulaMarkerWarning();
  });

  formulaOutput.addEventListener('keydown', (event) => {
    const marker = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-formula-marker]');
    if (!marker || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    event.stopPropagation();
    showFormulaMarkerWarning();
  });

  formulaOutput.addEventListener('pointerdown', (event) => {
    const token = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-placed-id]');
    const state = states.find((piece) => piece.id === token?.dataset.placedId);
    if (!token || !state || activePointer || activePlacedPointer) return;
    suppressNextPlacedClick = false;
    if (suppressPlacedClickTimer) {
      window.clearTimeout(suppressPlacedClickTimer);
      suppressPlacedClickTimer = 0;
    }
    event.preventDefault();
    measureLoosePiece(state);
    const bounds = token.getBoundingClientRect();
    const ghost = token.cloneNode(true) as HTMLButtonElement;
    ghost.removeAttribute('data-placed-id');
    ghost.classList.add('formula-token--dragging');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.tabIndex = -1;
    ghost.style.left = `${bounds.left}px`;
    ghost.style.top = `${bounds.top}px`;
    ghost.style.width = `${bounds.width}px`;
    ghost.style.transformOrigin = '0 0';
    ghost.dataset.dragZone = 'answer';
    const looseWidth = state.width || bounds.width * 1.2;
    const looseHeight = state.height || bounds.height * 1.2;
    const looseScale = clamp(Math.sqrt((looseWidth / bounds.width) * (looseHeight / bounds.height)), 1.08, 1.42);
    const reorderPreview = document.createElement('span');
    reorderPreview.className = 'formula-token formula-token--preview formula-token--reorder';
    reorderPreview.setAttribute('aria-hidden', 'true');
    reorderPreview.style.minWidth = `${bounds.width}px`;
    setPieceContent(reorderPreview, state);
    root.append(ghost);
    try { token.setPointerCapture(event.pointerId); } catch { /* pointer capture is best effort */ }
    activePlacedPointer = {
      state,
      token,
      ghost,
      id: event.pointerId,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      originalIndex: placedIds.indexOf(state.id),
      reorderIndex: null,
      reorderPreview,
      grabOffsetX: event.clientX - bounds.left,
      grabOffsetY: event.clientY - bounds.top,
      grabRatioX: clamp((event.clientX - bounds.left) / Math.max(1, bounds.width), 0, 1),
      grabRatioY: clamp((event.clientY - bounds.top) / Math.max(1, bounds.height), 0, 1),
      pointerX: event.clientX,
      pointerY: event.clientY,
      width: bounds.width,
      height: bounds.height,
      x: bounds.left,
      y: bounds.top,
      vx: 0,
      vy: 0,
      angle: 0,
      scale: 1,
      targetScale: 1,
      looseScale,
      zone: 'answer',
      targetX: bounds.left,
      targetY: bounds.top,
      targetAngle: 0,
      edge: null,
    };
    requestTick();
  });

  const finishPlacedDrag = (event: PointerEvent, cancelled = false) => {
    if (!activePlacedPointer || activePlacedPointer.id !== event.pointerId) return;
    const pointer = activePlacedPointer;
    const { state, token, ghost, moved, originalIndex, reorderIndex } = pointer;
    const clusterBounds = field.getBoundingClientRect();
    const answerBounds = inputCell.getBoundingClientRect();
    const visualWidth = pointer.width * pointer.scale;
    const visualHeight = pointer.height * pointer.scale;
    const centreX = pointer.x + visualWidth / 2;
    const centreY = pointer.y + visualHeight / 2;
    const droppedOnCluster = !cancelled && moved && pointer.zone === 'cluster' && (
      pointInside(centreX, centreY, clusterBounds, 4)
      || overlapRatio(pointer.x, pointer.y, visualWidth, visualHeight, clusterBounds) >= .28
    );
    const droppedOnAnswer = !cancelled && moved && pointer.zone === 'answer' && (
      pointInside(centreX, centreY, answerBounds, 7)
      || overlapRatio(pointer.x, pointer.y, visualWidth, visualHeight, answerBounds) >= .28
    );
    try {
      if (token.hasPointerCapture(event.pointerId)) token.releasePointerCapture(event.pointerId);
    } catch { /* capture may already be released */ }
    setEdgeContact(ghost, null);
    clearAnswerDropState();
    pointer.reorderPreview.remove();
    token.style.opacity = '';
    token.hidden = false;

    if (!cancelled && !moved) {
      ghost.remove();
      returnPiece(state.id);
    } else if (droppedOnCluster) {
      returnPlacedPieceAtDrop(pointer, event.clientX, event.clientY, () => ghost.remove());
    } else if (droppedOnAnswer && reorderIndex !== null) {
      ghost.remove();
      placedIds.splice(originalIndex, 1);
      placedIds.splice(reorderIndex, 0, state.id);
      renderFormula();
      clearStatus();
    } else if (moved) {
      ghost.remove();
      renderFormula();
    } else {
      ghost.remove();
    }
    if (cancelled) previewPiece(null);
    // A pointer click on a placed token is already handled above on pointerup.
    // renderFormula() replaces the token DOM when it returns a piece, so the
    // browser's follow-up click can otherwise retarget a newly rendered token
    // now sitting beneath the same coordinates and remove a second piece. Consume
    // that one follow-up click regardless of which token receives it. A new
    // pointerdown clears the guard immediately, with a timeout only as backup.
    if (!cancelled) {
      suppressNextPlacedClick = true;
      if (suppressPlacedClickTimer) window.clearTimeout(suppressPlacedClickTimer);
      suppressPlacedClickTimer = window.setTimeout(() => {
        suppressNextPlacedClick = false;
        suppressPlacedClickTimer = 0;
      }, 600);
    }
    activePlacedPointer = null;
  };

  document.addEventListener('pointerup', (event) => finishPlacedDrag(event));
  document.addEventListener('pointercancel', (event) => finishPlacedDrag(event, true));

  inputCell.addEventListener('click', (event) => {
    const placed = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-placed-id]');
    if (placed?.dataset.placedId) {
      if (suppressNextPlacedClick) {
        suppressNextPlacedClick = false;
        if (suppressPlacedClickTimer) {
          window.clearTimeout(suppressPlacedClickTimer);
          suppressPlacedClickTimer = 0;
        }
        event.preventDefault();
        return;
      }
      returnPiece(placed.dataset.placedId);
      return;
    }
    selectedCell = true;
    inputCell.dataset.selected = 'true';
  });

  inputCell.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if ((event.target as HTMLElement).matches('[data-placed-id]')) return;
    event.preventDefault();
    selectedCell = true;
    inputCell.dataset.selected = 'true';
  });

  inputCell.addEventListener('dragover', (event) => event.preventDefault());

  if (sampleDataButton && sampleDataSheet) {
    let sampleDataOpen = sampleDataButton.getAttribute('aria-expanded') === 'true';

    const setSampleDataOpen = (open: boolean, returnFocus = false) => {
      sampleDataOpen = open;
      sampleDataButton.setAttribute('aria-expanded', String(open));
      sampleDataButton.setAttribute('aria-label', `${open ? 'Collapse' : 'Expand'} sample data`);
      sampleDataSheet.dataset.open = String(open);
      sampleDataSheet.setAttribute('aria-hidden', String(!open));
      sampleDataSheet.toggleAttribute('inert', !open);
      if (open) canvas.dataset.sampleOpen = 'true';
      else delete canvas.dataset.sampleOpen;
      if (returnFocus) sampleDataButton.focus();
      window.setTimeout(scheduleClusterHeight, reducedMotion ? 0 : 210);
    };

    sampleDataButton.addEventListener('click', () => setSampleDataOpen(!sampleDataOpen));
    root.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !sampleDataOpen) return;
      event.preventDefault();
      setSampleDataOpen(false, true);
    });

    setSampleDataOpen(sampleDataOpen);
  }

  clearButton.addEventListener('click', () => {
    [...placedIds].forEach(returnPiece);
    clearStatus();
  });

  testAnswerButton.addEventListener('click', () => {
    const formulaTokens = placedIds.flatMap((id) => {
      const state = states.find((piece) => piece.id === id);
      return state ? [{ id: state.id, value: state.value, kind: state.kind }] : [];
    });
    const result = validateFormula(formulaTokens, buildWorksheetModel(sampleDataSheet));
    announceTestResult(result);
  });

  submitButton.addEventListener('click', () => {
    if (!placedIds.length) {
      showEmptySubmitWarning();
      return;
    }

    const remainingAttempts = QUESTION_MAX_ATTEMPTS - attempts;
    if (remainingAttempts <= 0) return;

    // Answer correctness is intentionally not implemented yet, so every non-empty
    // prototype submission consumes one failed attempt. Dividing the hidden exact
    // point pool by the attempts remaining guarantees the final attempt reaches 0,
    // even when a purchase has changed the pool to a fractional value.
    const attemptPointCost = currentPointsExact / remainingAttempts;
    currentPointsExact = clampPoints(currentPointsExact - attemptPointCost);
    attempts += 1;
    if (attempts >= QUESTION_MAX_ATTEMPTS) currentPointsExact = 0;
    renderQuestionScore();
    persistQuestionScore();

    const attemptsLeft = QUESTION_MAX_ATTEMPTS - attempts;
    if (attemptsLeft <= 0) {
      announce('Five attempts used. Answer checking comes later.');
      return;
    }
    announce(`Attempt ${attempts} recorded. ${attemptsLeft} attempts remain.`);
  });

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) requestTick();
    if (!visible && animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
  });
  observer.observe(field);

  const resizeObserver = new ResizeObserver(() => {
    if (!helpPanel.hidden) positionHelpPanel();
    const nextWidth = field.getBoundingClientRect().width;
    if (Math.abs(nextWidth - lastFieldWidth) < 2) return;
    populateBoardNotes();
    packCluster();
    if (!helpPanel.hidden) positionHelpPanel();
  });
  resizeObserver.observe(canvas);

  const answerResizeObserver = new ResizeObserver(() => {
    syncHoveredPieceToViewport();
    if (!helpPanel.hidden) positionHelpPanel();
    scheduleClusterHeight();
  });
  answerResizeObserver.observe(inputCell);

  populateBoardNotes();
  packCluster();
  renderFormula();
  updateStrings();
});
