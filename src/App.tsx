import React, { useState, useRef } from 'react';
import './styles/App.css';
import { generateDomainsForBrand } from './utils/domainGenerator';

function App() {
  const [inputValue, setInputValue] = useState<string>('');
  const [globalDomainsInput, setGlobalDomainsInput] = useState<string>('.casino .com .org .win .bingo');
  const [localDomainsInput, setLocalDomainsInput] = useState<string>('.uk .co.uk .org.uk');
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRun = () => {
    if (!inputValue.trim()) {
      inputRef.current?.focus();
      return;
    }

    // Используем вынесенную функцию
    const generatedDomains = generateDomainsForBrand({
      inputValue,
      globalDomainsInput,
      localDomainsInput
    });

    setOutputLines(generatedDomains);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setOutputLines([]);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRun();
    }
  };

  return (
    <div className="container">
      <h1 className="title">Подбор доменов для казино</h1>

      {/* Основное поле ввода бренда */}
      <div className="inputGroup">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Введите название бренда (например: pelican или sloto king casino)..."
          className="input"
          autoFocus
        />

        <div className="buttonGroup">
          <button onClick={handleRun} className="runButton">
            Запуск подбора
          </button>
          <button onClick={handleClear} className="clearButton">
            Очистить
          </button>
        </div>
      </div>

      {/* Контейнер для настроек доменов */}
      <div className="domainsSettingsContainer">

        {/* Глобальные домены */}
        <div className="domainsGroup">
          <div className="domainsHeader">
            <label htmlFor="globalDomains">
              Глобальные домены
            </label>
          </div>
          <textarea
            id="globalDomains"
            value={globalDomainsInput}
            onChange={(e) => setGlobalDomainsInput(e.target.value)}
            placeholder="Введите глобальные доменные зоны..."
            className="domainsTextarea"
            rows={4}
          />
          <div className="domainsHint">
            Пример: .casino .bet .com .org .net .io .win .vegas .bingo
          </div>
        </div>

        {/* Локальные домены (включая псевдо-локальные) */}
        <div className="domainsGroup">
          <div className="domainsHeader">
            <label htmlFor="localDomains">
              Локальные + Псевдо-локальные домены
            </label>
          </div>
          <textarea
            id="localDomains"
            value={localDomainsInput}
            onChange={(e) => setLocalDomainsInput(e.target.value)}
            placeholder="Введите локальные доменные зоны..."
            className="domainsTextarea"
            rows={4}
          />
          <div className="domainsHint">
            Пример: .uk .co.uk .org.uk .me.uk .gb.net .uk.com .uk.net
          </div>
        </div>

      </div>

      <div className="outputContainer">
        <div className="outputHeader">
          <h3>Результаты подбора доменов</h3>
          <div className="outputActions">
            <span className="counter">
              {outputLines.filter(line => !line.startsWith('Специальные') && !line.startsWith('Глобальные') && !line.startsWith('Локальные') && !line.startsWith('Обратное')).length} вариантов
            </span>
            {outputLines.length > 0 && (
              <button
                onClick={() => navigator.clipboard.writeText(outputLines.join('\n'))}
                className="copyButton"
              >
                Копировать всё
              </button>
            )}
          </div>
        </div>

        {outputLines.length === 0 ? (
          <div className="emptyState">
            <div className="emptyIcon">🔍</div>
            <div>Введите название бренда и нажмите "Запуск подбора"</div>
            <div className="emptyHint">
              Примеры: pelican, sloto king, sloto king casino, Spinbuddha
            </div>
          </div>
        ) : (
          <div className="output">
            {outputLines.map((line, index) => {
              const isHeader = line.startsWith('Специальные') || line.startsWith('Глобальные') || line.startsWith('Локальные') || line.startsWith('Обратное');
              const isItem = !isHeader;

              return (
                <div
                  key={index}
                  className={`outputLine ${isHeader ? 'outputHeaderLine' : ''} ${isItem ? 'outputItem' : ''}`}
                >
                  {line}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;