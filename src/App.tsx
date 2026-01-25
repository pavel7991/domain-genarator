import React, { useState, useRef } from 'react';
import './styles/App.css';

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

    // Подготовка бренда
    const originalBrand = inputValue.trim();

    // Проверяем, содержит ли ввод слово "casino"
    const containsCasinoWord = /\bcasino\b/i.test(originalBrand);

    const cleanBrand = originalBrand.toLowerCase().replace(/\s+casino\s*/i, '');
    const isTwoWordBrand = /\s+/.test(cleanBrand) || /-/.test(cleanBrand);

    // Основные варианты бренда
    const brandExact = cleanBrand.replace(/[-\s]/g, '');
    const brandWithHyphen = cleanBrand.replace(/\s+/g, '-');

    // withCasino варианты
    let brandWithCasino = brandExact;
    if (!brandExact.endsWith('casino')) {
      brandWithCasino = brandExact + 'casino';
    }

    // Вариант: exact + "-casino" (например "slotoking-casino")
    let brandExactHyphenCasino = brandExact;
    if (!brandExact.endsWith('casino')) {
      brandExactHyphenCasino = brandExact + '-casino';
    }

    // Вариант: "casino" + brand (слитный) - ПЕРВЫЙ (важен порядок!)
    let casinoPrefixBrandSlit = null;
    if (!brandExact.endsWith('casino')) {
      casinoPrefixBrandSlit = 'casino' + brandExact;
    }

    // Вариант: "casino-" + brand (дефисный) - ВТОРОЙ (важен порядок!)
    let casinoPrefixBrand = null;
    if (!brandExact.endsWith('casino')) {
      casinoPrefixBrand = 'casino-' + brandExact;
    }

    const brandVariants = {
      exact: brandExact,
      withHyphen: brandWithHyphen,
      withCasino: brandWithCasino,
      exactHyphenCasino: brandExactHyphenCasino,
      casinoPrefixBrandSlit: casinoPrefixBrandSlit,
      casinoPrefixBrand: casinoPrefixBrand,
      containsCasinoWord: containsCasinoWord
    };

    // Парсинг доменов - поддерживает и переносы строк, и пробелы
    const parseDomains = (input: string): string[] => {
      return input
        .split(/[\n\s]+/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(tld => {
          const cleanTld = tld.replace(/^\.+/, '.');
          return cleanTld.startsWith('.') ? cleanTld : `.${cleanTld}`;
        })
        .filter((tld, index, self) => self.indexOf(tld) === index);
    };

    const globalDomainsList = parseDomains(globalDomainsInput);
    const localDomainsList = parseDomains(localDomainsInput);

    // Список ВСЕХ возможных доменов из ввода пользователя
    const allUserDomains = [...globalDomainsList, ...localDomainsList];

    // Разделяем глобальные домены по типам - теперь проверяем только те, что есть у пользователя
    const specialDomains = ['.bet', '.win', '.vegas', '.bingo'];
    const casinoDomain = '.casino';

    // Оставляем только те специальные домены, которые есть в списке пользователя
    const availableSpecialDomains = specialDomains.filter(domain =>
      allUserDomains.includes(domain)
    );

    const commonDomains = globalDomainsList.filter(
      domain => !availableSpecialDomains.includes(domain) && domain !== casinoDomain
    );

    const newLines: Array<{type: 'header' | 'item', text: string}> = [];

    // Вспомогательная функция для проверки, нужно ли исключать вариант
    const shouldExcludeVariant = (brand: string, domain: string) => {
      if (domain === '.casino' && (brand === 'casino' || brand.endsWith('casino'))) {
        return true;
      }
      return false;
    };

    // Общая функция для генерации доменов (для глобальных и локальных)
    const generateDomains = (domainsList: string[], brandVariants: any, containsCasinoWord: boolean, isTwoWordBrand: boolean) => {
      const items: string[] = [];

      if (containsCasinoWord) {
        // Когда ввод содержит "casino" - порядок ВАЖЕН!

        // 1. tucancasino.com
        domainsList.forEach(tld => {
          if (!shouldExcludeVariant(brandVariants.withCasino, tld)) {
            items.push(`${brandVariants.withCasino}${tld}`);
          }
        });

        // 2. tucan-casino.com
        domainsList.forEach(tld => {
          if (!shouldExcludeVariant(brandVariants.exactHyphenCasino, tld)) {
            items.push(`${brandVariants.exactHyphenCasino}${tld}`);
          }
        });

        // 3. casinotucan.com (слитный) - ПЕРВЫЙ из casino- вариантов
        if (brandVariants.casinoPrefixBrandSlit) {
          domainsList.forEach(tld => {
            if (!shouldExcludeVariant(brandVariants.casinoPrefixBrandSlit!, tld)) {
              items.push(`${brandVariants.casinoPrefixBrandSlit}${tld}`);
            }
          });
        }

        // 4. casino-tucan.com (дефисный) - ВТОРОЙ из casino- вариантов
        if (brandVariants.casinoPrefixBrand) {
          domainsList.forEach(tld => {
            if (!shouldExcludeVariant(brandVariants.casinoPrefixBrand!, tld)) {
              items.push(`${brandVariants.casinoPrefixBrand}${tld}`);
            }
          });
        }
      } else {
        // Когда ввод НЕ содержит "casino" - порядок ВАЖЕН!

        // 1. tucan.com
        domainsList.forEach(tld => {
          if (!shouldExcludeVariant(brandVariants.exact, tld)) {
            items.push(`${brandVariants.exact}${tld}`);
          }
        });

        // 2. tucancasino.com
        domainsList.forEach(tld => {
          if (!shouldExcludeVariant(brandVariants.withCasino, tld)) {
            items.push(`${brandVariants.withCasino}${tld}`);
          }
        });

        // 3. tucan-casino.com
        domainsList.forEach(tld => {
          if (!shouldExcludeVariant(brandVariants.exactHyphenCasino, tld)) {
            items.push(`${brandVariants.exactHyphenCasino}${tld}`);
          }
        });

        // 4. casinotucan.com (слитный) - ПЕРВЫЙ из casino- вариантов
        if (brandVariants.casinoPrefixBrandSlit) {
          domainsList.forEach(tld => {
            if (!shouldExcludeVariant(brandVariants.casinoPrefixBrandSlit!, tld)) {
              items.push(`${brandVariants.casinoPrefixBrandSlit}${tld}`);
            }
          });
        }

        // 5. casino-tucan.com (дефисный) - ВТОРОЙ из casino- вариантов
        if (brandVariants.casinoPrefixBrand) {
          domainsList.forEach(tld => {
            if (!shouldExcludeVariant(brandVariants.casinoPrefixBrand!, tld)) {
              items.push(`${brandVariants.casinoPrefixBrand}${tld}`);
            }
          });
        }

        // 6. tucan-king.com (если двухсловный бренд)
        if (isTwoWordBrand) {
          domainsList.forEach(tld => {
            if (!shouldExcludeVariant(brandVariants.withHyphen, tld)) {
              items.push(`${brandVariants.withHyphen}${tld}`);
            }
          });
        }
      }

      return items;
    };

    // ПРИОРИТЕТ №1: Специальные зоны (.bet, .win, .vegas, .bingo) - если есть окончание
    // Показываем специальные зоны только если бренд НЕ содержит слово casino в оригинальном вводе
    const hasSpecialEnding = !containsCasinoWord && availableSpecialDomains.some(domain => {
      const ending = domain.substring(1);
      return brandVariants.exact.endsWith(ending);
    });

    if (hasSpecialEnding && availableSpecialDomains.length > 0) {
      newLines.push({ type: 'header', text: 'Специальные зоны (.bet/.win/.vegas/.bingo)' });

      const specialZoneItems: string[] = [];

      // Проверяем только те специальные домены, которые есть у пользователя
      availableSpecialDomains.forEach(domain => {
        const ending = domain.substring(1);
        if (brandVariants.exact.endsWith(ending)) {
          const brandWithoutEnding = brandVariants.exact.replace(new RegExp(`${ending}$`, 'i'), '');
          if (brandWithoutEnding && !shouldExcludeVariant(brandWithoutEnding, domain)) {
            specialZoneItems.push(`${brandWithoutEnding}${domain}`);
          }
        }
      });

      // Добавляем только если есть результаты
      if (specialZoneItems.length > 0) {
        specialZoneItems.forEach(item => {
          newLines.push({ type: 'item', text: item });
        });
      } else {
        // Убираем заголовок, если нет результатов
        newLines.pop();
      }
    }

    // ГЛОБАЛЬНЫЕ ДОМЕНЫ (включая .casino)
    const commonDomainItems: string[] = [];

    // Добавляем .casino только если он есть в списке пользователя
    if (allUserDomains.includes('.casino')) {
      if (!shouldExcludeVariant(brandVariants.exact, '.casino')) {
        commonDomainItems.push(`${brandVariants.exact}.casino`);
      }

      if (isTwoWordBrand && !shouldExcludeVariant(brandVariants.withHyphen, '.casino')) {
        commonDomainItems.push(`${brandVariants.withHyphen}.casino`);
      }
    }

    // Генерируем остальные глобальные домены
    if (commonDomains.length > 0) {
      const generatedGlobalDomains = generateDomains(commonDomains, brandVariants, containsCasinoWord, isTwoWordBrand);
      commonDomainItems.push(...generatedGlobalDomains);
    }

    if (commonDomainItems.length > 0) {
      newLines.push({ type: 'header', text: 'Глобальные домены' });
      commonDomainItems.forEach(item => {
        newLines.push({ type: 'item', text: item });
      });
    }

    // ЛОКАЛЬНЫЕ ДОМЕНЫ
    if (localDomainsList.length > 0) {
      const localDomainItems = generateDomains(localDomainsList, brandVariants, containsCasinoWord, isTwoWordBrand);

      if (localDomainItems.length > 0) {
        newLines.push({ type: 'header', text: 'Локальные домены' });
        localDomainItems.forEach(item => {
          newLines.push({ type: 'item', text: item });
        });
      }
    }

    const outputStrings = newLines.map(line => line.text);
    setOutputLines(outputStrings);
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