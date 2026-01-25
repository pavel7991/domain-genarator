// Типы внутри файла
interface BrandVariants {
  exact: string;
  exactWithCasino: string;
  withHyphen: string;
  withCasino: string;
  exactHyphenCasino: string;
  casinoPrefixBrandSlit: string | null;
  casinoPrefixBrand: string | null;
  brandEndsWithCasino: boolean;
  containsCasinoInName: boolean;
}

interface DomainGenerationOptions {
  inputValue: string;
  globalDomainsInput: string;
  localDomainsInput: string;
}

interface OutputLine {
  type: 'header' | 'item';
  text: string;
}

// Функция для подготовки бренда
const prepareBrandVariants = (inputValue: string): BrandVariants => {
  const originalBrand = inputValue.trim();

  // Проверяем, содержит ли ввод слово "casino" как отдельное слово в конце
  const containsCasinoAtEndAsWord = /\bcasino\b$/i.test(originalBrand);

  // Проверяем, заканчивается ли бренд на "casino" (слитно)
  const endsWithCasino = /casino$/i.test(originalBrand.replace(/[-\s]/g, ''));

  // Бренд заканчивается на casino (любым способом)
  const brandEndsWithCasino = containsCasinoAtEndAsWord || endsWithCasino;

  // Бренд содержит "casino" в начале или середине (но не в конце)
  const containsCasinoInName = /casino/i.test(originalBrand) && !brandEndsWithCasino;

  let brandWithoutCasino: string;
  let brandWithCasinoAtEnd: string;

  if (brandEndsWithCasino) {
    // Когда заканчивается на casino
    if (containsCasinoAtEndAsWord) {
      // "tucan casino" - отдельное слово
      brandWithoutCasino = originalBrand.toLowerCase().replace(/\s+casino\b\s*/i, '').trim();
      brandWithCasinoAtEnd = brandWithoutCasino.replace(/[-\s]/g, '') + 'casino';
    } else {
      // "tucancasino" - слитно
      brandWithoutCasino = originalBrand.toLowerCase().replace(/casino$/i, '');
      brandWithCasinoAtEnd = originalBrand.toLowerCase();
    }
  } else {
    // Когда НЕ заканчивается на casino
    brandWithoutCasino = originalBrand.toLowerCase().replace(/\s+casino\s*/i, '');
    brandWithCasinoAtEnd = brandWithoutCasino.replace(/[-\s]/g, '');
  }

  // Очищаем от пробелов и дефисов
  brandWithoutCasino = brandWithoutCasino.replace(/[-\s]/g, '');

  const cleanBrand = brandWithoutCasino;

  // Основные варианты бренда
  const brandExact = cleanBrand;
  const brandWithHyphen = originalBrand.toLowerCase()
    .replace(/\bcasino\b/gi, '')  // Сначала удаляем слово casino
    .trim()                       // Убираем пробелы по краям
    .replace(/\s+/g, '-')         // Потом заменяем пробелы на дефисы
    .replace(/-+$/g, '');

  // withCasino варианты
  const brandWithCasino = brandEndsWithCasino ? brandWithCasinoAtEnd : (brandExact + 'casino');

  // Вариант: exact + "-casino"
  const brandExactHyphenCasino = brandExact + '-casino';

  // Вариант: "casino" + brand (слитный)
  let casinoPrefixBrandSlit = null;
  if (!containsCasinoInName && !brandExact.startsWith('casino')) {
    casinoPrefixBrandSlit = 'casino' + brandExact;
  }

  // Вариант: "casino-" + brand (дефисный)
  let casinoPrefixBrand = null;
  if (!containsCasinoInName && !brandExact.startsWith('casino')) {
    casinoPrefixBrand = 'casino-' + brandExact;
  }

  return {
    exact: brandExact,
    exactWithCasino: brandWithCasinoAtEnd,
    withHyphen: brandWithHyphen,
    withCasino: brandWithCasino,
    exactHyphenCasino: brandExactHyphenCasino,
    casinoPrefixBrandSlit,
    casinoPrefixBrand,
    brandEndsWithCasino,
    containsCasinoInName
  };
};

// Функция для парсинга доменов
export const parseDomains = (input: string): string[] => {
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

// Вспомогательная функция для проверки, нужно ли исключать вариант
const shouldExcludeVariant = (brand: string, domain: string, containsCasinoInName: boolean): boolean => {
  // Если casino часть имени бренда (в середине или начале), исключаем домены .casino
  if (containsCasinoInName && domain === '.casino') {
    return true;
  }

  // Исключаем варианты, где бренд заканчивается на casino И домен .casino
  if (domain === '.casino' && brand.toLowerCase().endsWith('casino')) {
    return true;
  }

  // Исключаем варианты casino-casino... (двойной префикс)
  if (brand.toLowerCase().startsWith('casino-casino')) {
    return true;
  }

  // Исключаем варианты, где casino часть имени бренда И добавляется еще casino
  if (containsCasinoInName && (brand.toLowerCase().includes('casinocasino') || brand.toLowerCase().includes('casino-casino'))) {
    return true;
  }

  return false;
};

// Функция генерации доменов для .casino домена
const generateCasinoDomain = (
  brandVariants: BrandVariants,
  isTwoWordBrand: boolean,
  containsCasinoInName: boolean
): string[] => {
  const items: string[] = [];

  // Добавляем .casino только если casino НЕ часть имени
  if (!containsCasinoInName) {
    // Базовый вариант для .casino
    if (!shouldExcludeVariant(brandVariants.exact, '.casino', containsCasinoInName)) {
      items.push(`${brandVariants.exact}.casino`);
    }

    // Дефисный вариант для двухсловных брендов в .casino
    if (isTwoWordBrand && !shouldExcludeVariant(brandVariants.withHyphen, '.casino', containsCasinoInName)) {
      items.push(`${brandVariants.withHyphen}.casino`);
    }
  }

  return items;
};

// Функция генерации доменов БЕЗ casino (кроме .casino)
const generateDomainsWithoutCasino = (
  domainsList: string[],
  brandVariants: BrandVariants,
  isTwoWordBrand: boolean,
  brandEndsWithCasino: boolean
): string[] => {
  const items: string[] = [];

  // Генерируем варианты БЕЗ casino ТОЛЬКО если бренд НЕ заканчивается на casino
  if (!brandEndsWithCasino) {
    // 1. Базовый вариант (slotoking.com, slotoking.org)
    domainsList.forEach(tld => {
      if (!shouldExcludeVariant(brandVariants.exact, tld, false)) {
        items.push(`${brandVariants.exact}${tld}`);
      }
    });

    // 2. Дефисный вариант для двухсловных (sloto-king.com, sloto-king.org)
    if (isTwoWordBrand) {
      domainsList.forEach(tld => {
        if (!shouldExcludeVariant(brandVariants.withHyphen, tld, false)) {
          items.push(`${brandVariants.withHyphen}${tld}`);
        }
      });
    }
  }

  return items;
};

// Функция генерации доменов С casino (кроме .casino)
const generateDomainsWithCasino = (
  domainsList: string[],
  brandVariants: BrandVariants,
  brandEndsWithCasino: boolean,
  containsCasinoInName: boolean
): string[] => {
  const items: string[] = [];

  if (containsCasinoInName) {
    // Когда casino часть имени бренда (casino2024, goldencasino1) - только базовые варианты
    // (уже сгенерированы в generateDomainsWithoutCasino)
    domainsList.forEach(tld => {
      if (!shouldExcludeVariant(brandVariants.exact, tld, containsCasinoInName)) {
        items.push(`${brandVariants.exact}${tld}`);
      }
    });

    // Дефисный вариант для двухсловных брендов
    const isTwoWordBrand = brandVariants.withHyphen.includes('-');
    if (isTwoWordBrand) {
      domainsList.forEach(tld => {
        if (!shouldExcludeVariant(brandVariants.withHyphen, tld, containsCasinoInName)) {
          items.push(`${brandVariants.withHyphen}${tld}`);
        }
      });
    }
  } else if (brandEndsWithCasino) {
    // Когда бренд заканчивается на casino (tucan casino или tucancasino)
    // 1. Вариант С casino в конце (tucancasino.com)
    domainsList.forEach(tld => {
      if (!shouldExcludeVariant(brandVariants.exactWithCasino, tld, containsCasinoInName)) {
        items.push(`${brandVariants.exactWithCasino}${tld}`);
      }
    });

    // 2. Вариант без casino + "-casino" (tucan-casino.com)
    domainsList.forEach(tld => {
      if (!shouldExcludeVariant(brandVariants.exactHyphenCasino, tld, containsCasinoInName)) {
        items.push(`${brandVariants.exactHyphenCasino}${tld}`);
      }
    });

    // 3. casino + brand без casino (слитный) (casinotucan.com)
    const casinoPrefixBrandSlitValue = brandVariants.casinoPrefixBrandSlit;
    if (casinoPrefixBrandSlitValue !== null) {
      domainsList.forEach(tld => {
        if (!shouldExcludeVariant(casinoPrefixBrandSlitValue, tld, containsCasinoInName)) {
          items.push(`${casinoPrefixBrandSlitValue}${tld}`);
        }
      });
    }

    // 4. casino- + brand без casino (дефисный) (casino-tucan.com)
    const casinoPrefixBrandValue = brandVariants.casinoPrefixBrand;
    if (casinoPrefixBrandValue !== null) {
      domainsList.forEach(tld => {
        if (!shouldExcludeVariant(casinoPrefixBrandValue, tld, containsCasinoInName)) {
          items.push(`${casinoPrefixBrandValue}${tld}`);
        }
      });
    }
  } else {
    // Когда ввод НЕ содержит "casino" вообще
    // 1. Вариант с casino в конце (slotokingcasino.com)
    if (brandVariants.withCasino) {
      domainsList.forEach(tld => {
        if (!shouldExcludeVariant(brandVariants.withCasino, tld, containsCasinoInName)) {
          items.push(`${brandVariants.withCasino}${tld}`);
        }
      });
    }

    // 2. Вариант с -casino в конце (slotoking-casino.com)
    if (brandVariants.exactHyphenCasino) {
      domainsList.forEach(tld => {
        if (!shouldExcludeVariant(brandVariants.exactHyphenCasino, tld, containsCasinoInName)) {
          items.push(`${brandVariants.exactHyphenCasino}${tld}`);
        }
      });
    }

    // 3. casino + brand (слитный) (casinoslotoking.com)
    const casinoPrefixBrandSlitValue = brandVariants.casinoPrefixBrandSlit;
    if (casinoPrefixBrandSlitValue !== null) {
      domainsList.forEach(tld => {
        if (!shouldExcludeVariant(casinoPrefixBrandSlitValue, tld, containsCasinoInName)) {
          items.push(`${casinoPrefixBrandSlitValue}${tld}`);
        }
      });
    }

    // 4. casino- + brand (дефисный) (casino-slotoking.com)
    const casinoPrefixBrandValue = brandVariants.casinoPrefixBrand;
    if (casinoPrefixBrandValue !== null) {
      domainsList.forEach(tld => {
        if (!shouldExcludeVariant(casinoPrefixBrandValue, tld, containsCasinoInName)) {
          items.push(`${casinoPrefixBrandValue}${tld}`);
        }
      });
    }
  }

  return items;
};

// Основная функция для генерации доменов
export const generateDomainsForBrand = ({
                                          inputValue,
                                          globalDomainsInput,
                                          localDomainsInput
                                        }: DomainGenerationOptions): string[] => {
  if (!inputValue.trim()) {
    return [];
  }

  const brandVariants = prepareBrandVariants(inputValue);

  // Определяем, является ли бренд двухсловным
  const isTwoWordBrand = /\s+/.test(inputValue.replace(/\bcasino\b/gi, '').trim()) || /-/.test(inputValue);

  // Парсинг доменов
  const globalDomainsList = parseDomains(globalDomainsInput);
  const localDomainsList = parseDomains(localDomainsInput);

  // Список ВСЕХ возможных доменов
  const allUserDomains = [...globalDomainsList, ...localDomainsList];

  // Разделяем глобальные домены по типам
  const specialDomains = ['.bet', '.win', '.vegas', '.bingo'];
  const casinoDomain = '.casino';

  const availableSpecialDomains = specialDomains.filter(domain =>
    allUserDomains.includes(domain)
  );

  const commonDomains = globalDomainsList.filter(
    domain => !availableSpecialDomains.includes(domain) && domain !== casinoDomain
  );

  const newLines: OutputLine[] = [];

  // ПРИОРИТЕТ №1: Специальные зоны
  const hasSpecialEnding = !brandVariants.brandEndsWithCasino &&
    !brandVariants.containsCasinoInName &&
    availableSpecialDomains.some(domain => {
      const ending = domain.substring(1);
      return brandVariants.exact.endsWith(ending);
    });

  if (hasSpecialEnding && availableSpecialDomains.length > 0) {
    newLines.push({ type: 'header', text: 'Специальные зоны (.bet/.win/.vegas/.bingo)' });

    const specialZoneItems: string[] = [];

    availableSpecialDomains.forEach(domain => {
      const ending = domain.substring(1);
      if (brandVariants.exact.endsWith(ending)) {
        const brandWithoutEnding = brandVariants.exact.replace(new RegExp(`${ending}$`, 'i'), '');
        if (brandWithoutEnding && !shouldExcludeVariant(brandWithoutEnding, domain, brandVariants.containsCasinoInName)) {
          specialZoneItems.push(`${brandWithoutEnding}${domain}`);
        }
      }
    });

    if (specialZoneItems.length > 0) {
      specialZoneItems.forEach(item => {
        newLines.push({ type: 'item', text: item });
      });
    } else {
      newLines.pop(); // Убираем заголовок, если нет результатов
    }
  }

  // ГЛОБАЛЬНЫЕ ДОМЕНЫ
  const commonDomainItems: string[] = [];

  // 1. Домен .casino ПЕРВЫМ (slotoking.casino, sloto-king.casino)
  if (allUserDomains.includes('.casino')) {
    const casinoDomainItems = generateCasinoDomain(
      brandVariants,
      isTwoWordBrand,
      brandVariants.containsCasinoInName
    );
    commonDomainItems.push(...casinoDomainItems);
  }

  // 2. Домены БЕЗ casino (slotoking.com, slotoking.org, sloto-king.com, sloto-king.org)
  // ТОЛЬКО если бренд НЕ заканчивается на casino
  if (commonDomains.length > 0) {
    const withoutCasinoItems = generateDomainsWithoutCasino(
      commonDomains,
      brandVariants,
      isTwoWordBrand,
      brandVariants.brandEndsWithCasino
    );
    commonDomainItems.push(...withoutCasinoItems);
  }

  // 3. Домены С casino (slotokingcasino.com, slotoking-casino.com и т.д.)
  if (commonDomains.length > 0) {
    const withCasinoItems = generateDomainsWithCasino(
      commonDomains,
      brandVariants,
      brandVariants.brandEndsWithCasino,
      brandVariants.containsCasinoInName
    );
    commonDomainItems.push(...withCasinoItems);
  }

  if (commonDomainItems.length > 0) {
    newLines.push({ type: 'header', text: 'Глобальные домены' });
    commonDomainItems.forEach(item => {
      newLines.push({ type: 'item', text: item });
    });
  }

  // ЛОКАЛЬНЫЕ ДОМЕНЫ (такой же порядок)
  if (localDomainsList.length > 0) {
    const localDomainItems: string[] = [];

    // 1. Локальные домены БЕЗ casino ТОЛЬКО если бренд НЕ заканчивается на casino
    const localWithoutCasinoItems = generateDomainsWithoutCasino(
      localDomainsList,
      brandVariants,
      isTwoWordBrand,
      brandVariants.brandEndsWithCasino
    );
    localDomainItems.push(...localWithoutCasinoItems);

    // 2. Локальные домены С casino
    const localWithCasinoItems = generateDomainsWithCasino(
      localDomainsList,
      brandVariants,
      brandVariants.brandEndsWithCasino,
      brandVariants.containsCasinoInName
    );
    localDomainItems.push(...localWithCasinoItems);

    if (localDomainItems.length > 0) {
      newLines.push({ type: 'header', text: 'Локальные домены' });
      localDomainItems.forEach(item => {
        newLines.push({ type: 'item', text: item });
      });
    }
  }

  // Преобразуем в массив строк
  return newLines.map(line => line.text);
};