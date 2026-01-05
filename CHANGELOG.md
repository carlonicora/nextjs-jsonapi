## [1.22.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.21.0...v1.22.0) (2026-01-05)

### 🚀 Features

* add module support to ContentTitle component and update usages in details views ([b23995d](https://github.com/carlonicora/nextjs-jsonapi/commit/b23995d949b4988070d1c06558a5ec1982c99a0d))

## [1.21.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.20.0...v1.21.0) (2026-01-05)

### 🚀 Features

* enhance login form with conditional rendering for internal and Discord authentication ([4845ce0](https://github.com/carlonicora/nextjs-jsonapi/commit/4845ce00601f54c29d2bcb7b998fac5ad7120af2))

## [1.20.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.19.2...v1.20.0) (2026-01-04)

### 🚀 Features

* allow submodules generation ([853af9f](https://github.com/carlonicora/nextjs-jsonapi/commit/853af9f41d9515a47cedfc253800859ad1b3edca))

## [1.19.2](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.19.1...v1.19.2) (2026-01-04)

### 🐛 Bug Fixes

* rename parameter in rehydrate function for clarity ([bd29932](https://github.com/carlonicora/nextjs-jsonapi/commit/bd2993226a8e367fb4a95fa9f23fbe8402885a36))

## [1.19.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.19.0...v1.19.1) (2026-01-03)

### 🐛 Bug Fixes

* remove project templated from web module generation ([2889413](https://github.com/carlonicora/nextjs-jsonapi/commit/28894138f3691bc4a06fac38649bf640b30bbea5))

## [1.19.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.18.0...v1.19.0) (2026-01-03)

### 🚀 Features

* clear stale data before refreshing in useDataListRetriever ([2202d1e](https://github.com/carlonicora/nextjs-jsonapi/commit/2202d1eceeff0d69ab795c9baced5da000e37c68))

### 💎 Styles

* correct command item style ([2e010bc](https://github.com/carlonicora/nextjs-jsonapi/commit/2e010bc2b18bc9de1f32f64d1d288477fdabacc0))

## [1.18.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.17.0...v1.18.0) (2026-01-02)

### 🚀 Features

* centralised tests with vite ([fdd7a7c](https://github.com/carlonicora/nextjs-jsonapi/commit/fdd7a7c4912f43b8e2c6b62e6e11c1067ec267f0))
* update to new shadcn and base-ui ([b6a0867](https://github.com/carlonicora/nextjs-jsonapi/commit/b6a08677160825db424c64d59ed9f2b83d9bb88d))

## [1.17.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.16.0...v1.17.0) (2026-01-02)

### 🚀 Features

* add allowRegistration ([619eb2e](https://github.com/carlonicora/nextjs-jsonapi/commit/619eb2e434fee5b4d404e152dad1153d4a9ea5e9))
* add tests ([9d158f2](https://github.com/carlonicora/nextjs-jsonapi/commit/9d158f248939236d461e269f095d362dd06804e1))
* refactor authentication handling by moving Discord and internal auth logic to login module ([12b79cb](https://github.com/carlonicora/nextjs-jsonapi/commit/12b79cb6e1acb5565b47b2eb8ad5b96913de370f))
* refactor authentication handling by moving Discord and internal auth logic to login module ([d72b956](https://github.com/carlonicora/nextjs-jsonapi/commit/d72b9561c22142b70f36e1cc66895ceb5d19c213))

## [1.16.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.15.0...v1.16.0) (2026-01-02)

### 🚀 Features

* add description and features fields to stripe prices ([24f3eb6](https://github.com/carlonicora/nextjs-jsonapi/commit/24f3eb646e1c342b13c5198649b761a7f095b71f))
* add single billing entry point ([b456cd9](https://github.com/carlonicora/nextjs-jsonapi/commit/b456cd99623da87a7ff6ea168bc17015a5d19627))
* add stripe price archival and restore ([583ee56](https://github.com/carlonicora/nextjs-jsonapi/commit/583ee5600b8cdbbbca721c4c146d523c195113dc))
* add StripePaymentMethod module and related classes for payment processing ([0ffc460](https://github.com/carlonicora/nextjs-jsonapi/commit/0ffc46061c10f3c578826d01e63afaa4dd653ab8))
* add StripePaymentMethod module to bootstrapper template ([0326f64](https://github.com/carlonicora/nextjs-jsonapi/commit/0326f645435d0fe68a751ff4c93787d8f43eb5fe))
* add StripeProvider and integrate Stripe publishable key configuration ([1b3fa29](https://github.com/carlonicora/nextjs-jsonapi/commit/1b3fa29cc504813750cf6bbb96fad06e899442bb))
* add type annotations for onClick event in ContributorsList and UserAvatar components ([29f392d](https://github.com/carlonicora/nextjs-jsonapi/commit/29f392d0a4fe189764015250507d3bbc39bcb015))
* allow endpoint to accept string type in EndpointQuery ([66013d8](https://github.com/carlonicora/nextjs-jsonapi/commit/66013d81314ee03e138a98b181f4f84a466cdb2e))
* **billing:** add billing components, services, and interfaces ([5efb3e7](https://github.com/carlonicora/nextjs-jsonapi/commit/5efb3e708a7090113b3f533dc394e8d621062f76))
* enhance subscription and payment components with improved formatting and sync functionality ([8fc027b](https://github.com/carlonicora/nextjs-jsonapi/commit/8fc027bf20d11c9abb5fff762de185c217bac646))
* enhance subscription management with cancelation status and improved data handling ([8cd23ef](https://github.com/carlonicora/nextjs-jsonapi/commit/8cd23ef37efa0037f83ae87631e60299c24cbe2a))
* implement payment method checks and editor in subscription forms ([d82d625](https://github.com/carlonicora/nextjs-jsonapi/commit/d82d625de3a97bb3b75eca4f42a7dc0aabedcfe6))
* implement SCA-compliant payment confirmation flow for subscriptions ([0e29864](https://github.com/carlonicora/nextjs-jsonapi/commit/0e29864b0f67fea5a998cefa7dd91bfc6cd8c66e))
* refactor CompanyEditor and FormFeatures components for improved feature handling ([d31d438](https://github.com/carlonicora/nextjs-jsonapi/commit/d31d438afb59b3ba11217e2f75cccda07005d405))
* remove CompanyConfigurationEditor from CompanyProvider functions ([9f24981](https://github.com/carlonicora/nextjs-jsonapi/commit/9f2498104f4e70033110610447b7096612b126f1))
* remove isCore property from ModuleInterface and Module class ([e095a82](https://github.com/carlonicora/nextjs-jsonapi/commit/e095a8242b359e32f7aa69b12ac728256e78ca7a))
* rename isProduction to isCore in FeatureInterface and implementation ([87ee10e](https://github.com/carlonicora/nextjs-jsonapi/commit/87ee10e19bed0d74e50346fc5abdb8b870e7ae93))

### 🐛 Bug Fixes

* correct linting ([11ca437](https://github.com/carlonicora/nextjs-jsonapi/commit/11ca4377a18d5938f29af18aa06d71af55ff771c))
* correct linting ([d1fdce1](https://github.com/carlonicora/nextjs-jsonapi/commit/d1fdce1fa8f4f2ee7c6b62f2d1db71fef732e6bf))
* remove console logs ([d1769e2](https://github.com/carlonicora/nextjs-jsonapi/commit/d1769e231abb9fc9f24008e91b833aba47fa0221))

### 💎 Styles

* update product selector ([04eaee6](https://github.com/carlonicora/nextjs-jsonapi/commit/04eaee620e82a69e2c81d41c9b617728f3c3f9e0))

### 📦 Code Refactoring

* rename billing modules to stripe modules for clarity and consistency ([e3d4d45](https://github.com/carlonicora/nextjs-jsonapi/commit/e3d4d4506f9f1285444fcc9efec5479a6e6340ec))

## [1.15.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.14.0...v1.15.0) (2025-12-28)

### 🚀 Features

* enhance relationship handling in templates ([6faa1ef](https://github.com/carlonicora/nextjs-jsonapi/commit/6faa1ef0cef13320b32412af84d84213d865a128))

## [1.14.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.13.0...v1.14.0) (2025-12-27)

### 🚀 Features

* enhance notification handling with message and actionUrl support ([b24a8d5](https://github.com/carlonicora/nextjs-jsonapi/commit/b24a8d51b8ded1664a138933db5fd65d91effd84))

## [1.13.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.12.0...v1.13.0) (2025-12-27)

### 🚀 Features

* add InputOTP component and update exports in shadcnui ([3b2d99f](https://github.com/carlonicora/nextjs-jsonapi/commit/3b2d99f037afb58561ac360b44e74c0a3606477b))

### 🐛 Bug Fixes

* simplify error handling in AbstractService by removing response from error message ([c4c4064](https://github.com/carlonicora/nextjs-jsonapi/commit/c4c4064ba7181f81b13239e0f07d298cbf04105a))

## [1.12.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.11.0...v1.12.0) (2025-12-26)

### 🚀 Features

* add header to PageContentContainer ([c34030f](https://github.com/carlonicora/nextjs-jsonapi/commit/c34030f893d550bdb27f88b5bfcbcd0d20f47294))
* refactor ContentTitle layout for improved structure and readability ([03c3735](https://github.com/carlonicora/nextjs-jsonapi/commit/03c37350fe4950a5a0997b06a604e9ba6db55502))

## [1.11.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.10.0...v1.11.0) (2025-12-24)

### 🚀 Features

* enhance global state management in ModuleRegistry and bootstrapStore for HMR support ([647cb5e](https://github.com/carlonicora/nextjs-jsonapi/commit/647cb5e964f8ee42d43fee3f5703fd42585b0ddc))

## [1.10.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.9.1...v1.10.0) (2025-12-24)

### 🚀 Features

* enhance PageContentContainer for responsive layout and loading state ([f2d7a72](https://github.com/carlonicora/nextjs-jsonapi/commit/f2d7a72f01b44fe1d7e101669b1ff12bd2d18247))

## [1.9.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.9.0...v1.9.1) (2025-12-24)

### 🐛 Bug Fixes

* replace zlib with pako for gzip compression in AuthCookies and ServerSession ([a4f1de2](https://github.com/carlonicora/nextjs-jsonapi/commit/a4f1de22a62ab2215905dae1cefac1824c3d9a28))

## [1.9.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.8.1...v1.9.0) (2025-12-21)

### 🚀 Features

* implement bootstrapper registration and self-healing module loading ([a8f4f6f](https://github.com/carlonicora/nextjs-jsonapi/commit/a8f4f6faeaf51529ae7bdc707e051536da18e8e9))

## [1.8.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.8.0...v1.8.1) (2025-12-21)

### 🐛 Bug Fixes

* standardize module name casing in i18n keys and form schema generation ([680179d](https://github.com/carlonicora/nextjs-jsonapi/commit/680179d9f232f8a57db033e3fc021c9eb2bdb10f))

## [1.8.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.7.6...v1.8.0) (2025-12-21)

### 🚀 Features

* enhance relationship handling by adding support for edge properties and updating imports ([1aae701](https://github.com/carlonicora/nextjs-jsonapi/commit/1aae701a3300830e161c3cd3465210e12ad00489))

## [1.7.6](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.7.5...v1.7.6) (2025-12-20)

### 🐛 Bug Fixes

* reorder import statements and streamline code formatting in model template ([e96448c](https://github.com/carlonicora/nextjs-jsonapi/commit/e96448ce51970242a4e52a21aff8b4d7f8f9a839))

## [1.7.5](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.7.4...v1.7.5) (2025-12-20)

### 🐛 Bug Fixes

* extend useUrlRewriter parameters to include childId ([967a5ca](https://github.com/carlonicora/nextjs-jsonapi/commit/967a5caa386ff36c94676e74c14f92e7680a607f))

## [1.7.4](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.7.3...v1.7.4) (2025-12-20)

### 🐛 Bug Fixes

* update formatDate to accept locale parameter and use it for date formatting ([d7b4f64](https://github.com/carlonicora/nextjs-jsonapi/commit/d7b4f64599d35c3870207079ccc10adbff0b0da6))

## [1.7.3](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.7.2...v1.7.3) (2025-12-19)

### 🐛 Bug Fixes

* export DropzoneOptions type from react-dropzone ([01d8c87](https://github.com/carlonicora/nextjs-jsonapi/commit/01d8c87a4b5638218c4c08c47e29ff0ae6868388))

## [1.7.2](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.7.1...v1.7.2) (2025-12-16)

### 💎 Styles

* correct file structure ([0b582e3](https://github.com/carlonicora/nextjs-jsonapi/commit/0b582e31e0395bd403ab243f15b849d86f702883))

## [1.7.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.7.0...v1.7.1) (2025-12-16)

### 🐛 Bug Fixes

* update generate web module ([08e5104](https://github.com/carlonicora/nextjs-jsonapi/commit/08e5104892cb8ea39d8c9361d2484f563be39c79))

## [1.7.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.6.0...v1.7.0) (2025-12-15)

### 🚀 Features

* add service exports for various features ([ebb1ee3](https://github.com/carlonicora/nextjs-jsonapi/commit/ebb1ee3f3ea1a5d0290974f601b9382d04f8d706))

## [1.6.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.5.0...v1.6.0) (2025-12-15)

### 🚀 Features

* update complete structure to avoid client/server issues ([7ce60aa](https://github.com/carlonicora/nextjs-jsonapi/commit/7ce60aac67e1a97f1298fa81fd83d41e184ff785))

## [1.5.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.4.0...v1.5.0) (2025-12-15)

### 🚀 Features

* add discord flag ([38bda89](https://github.com/carlonicora/nextjs-jsonapi/commit/38bda8955465a685169dc9340e9a1aee843163f3))

## [1.4.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.3.1...v1.4.0) (2025-12-15)

### 🚀 Features

* add login definition ([5c2daeb](https://github.com/carlonicora/nextjs-jsonapi/commit/5c2daeb74464fb76a16e1d92686bbf32f2f98123))

## [1.3.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.3.0...v1.3.1) (2025-12-15)

### 🐛 Bug Fixes

* correct logo url ([7bba8fc](https://github.com/carlonicora/nextjs-jsonapi/commit/7bba8fcae3dfae03f905cc2b80f54808267930e9))

## [1.3.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.2.0...v1.3.0) (2025-12-15)

### 🚀 Features

* add cli generator ([f4e1078](https://github.com/carlonicora/nextjs-jsonapi/commit/f4e1078d0fa5af1af10342426f9d9100e8292c53))

## [1.2.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.1.1...v1.2.0) (2025-12-13)

### 🚀 Features

* add user module to exports ([164380f](https://github.com/carlonicora/nextjs-jsonapi/commit/164380f768420ec7334847895e669e0d257356ea))

## [1.1.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.1.0...v1.1.1) (2025-12-11)

### 🐛 Bug Fixes

* correct linting issues ([b95709e](https://github.com/carlonicora/nextjs-jsonapi/commit/b95709e3417d51ec398d8cff6697e996e80c2725))

## [1.1.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.0.6...v1.1.0) (2025-12-11)

### 🚀 Features

* add default icon to module ([a2162a3](https://github.com/carlonicora/nextjs-jsonapi/commit/a2162a32117459b98b330b666ec34bff99e95bab))
* add expertise cell to content table ([4656af4](https://github.com/carlonicora/nextjs-jsonapi/commit/4656af4e8dbe50e6647225c4b5066d6b6dc6f9a4))
* add findByModelName method to ModuleRegistry for direct model lookups ([98268de](https://github.com/carlonicora/nextjs-jsonapi/commit/98268dece84ba5db70ad3fde750e181a506763d9))

### 🐛 Bug Fixes

* remove app-specific code from content table ([549f040](https://github.com/carlonicora/nextjs-jsonapi/commit/549f040156b03e3c9bd54d6c809f2cd4dffafcd1))
* remove app-specific code from content table ([19dd3da](https://github.com/carlonicora/nextjs-jsonapi/commit/19dd3da040856c9273721dfbc1ca367e70f416dc))

### 📦 Code Refactoring

* move content components to nextjs-jsonapi ([1d0dcb8](https://github.com/carlonicora/nextjs-jsonapi/commit/1d0dcb817ea5f1b8e30f7bd3e58c9a8115a86593))

## [1.0.6](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.0.5...v1.0.6) (2025-12-11)

### 📚 Documentation

* add license ([ff4663b](https://github.com/carlonicora/nextjs-jsonapi/commit/ff4663b7aee286b4710ee35cc6fd3fc8dcb978a3))

## [1.0.5](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.0.4...v1.0.5) (2025-12-11)

### 📦 Code Refactoring

* move Auth components to nextjs-jsonapi ([8cc32da](https://github.com/carlonicora/nextjs-jsonapi/commit/8cc32da5c9bea0cc3f9a7a379b1ed89c9cc440f7))
* move CommonContext to nextjs-jsonapi ([00438c3](https://github.com/carlonicora/nextjs-jsonapi/commit/00438c34c12d485ec366ded2eb56aa8a80b56f98))
* move FeatureForm to nextjs-jsonapi ([0fd3777](https://github.com/carlonicora/nextjs-jsonapi/commit/0fd3777d0f41cc86cec31a9e0c9ae7303536fd11))
* move notification components to nextjs-jsonapi ([a8bfed8](https://github.com/carlonicora/nextjs-jsonapi/commit/a8bfed8a1830cb47cc5ea7e61fef40485c559087))
* move page tracker to nextjs-jsonapi ([f3a05c8](https://github.com/carlonicora/nextjs-jsonapi/commit/f3a05c84b011a3ccb4939700929e4022117e00a2))
* move Role components to nextjs-jsonapi ([8ebdaca](https://github.com/carlonicora/nextjs-jsonapi/commit/8ebdaca06a2ccc6746bce72098a0bb2ba7d0a48a))
* move ServerSession to nextjs-jsonapi ([c5154d0](https://github.com/carlonicora/nextjs-jsonapi/commit/c5154d0039a8c6b57bf49562e881ef8c8a22f20f))
* move SocketContext to nextjs-jsonapi ([a86c988](https://github.com/carlonicora/nextjs-jsonapi/commit/a86c98834eb85595d88d52442b6dfe3947760d1f))
* move user and company components to nextjs-jsonapi ([82e6456](https://github.com/carlonicora/nextjs-jsonapi/commit/82e64560cc14d68c3fb21ae19cc11173277e369a))
* reorganised modules ([d188c32](https://github.com/carlonicora/nextjs-jsonapi/commit/d188c32ddaa6c98971ee0d8dc38da3bbb47e467f))

## [1.0.4](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.0.3...v1.0.4) (2025-12-10)

### 🐛 Bug Fixes

* include src directory in npm package for Tailwind CSS scanning ([501cdee](https://github.com/carlonicora/nextjs-jsonapi/commit/501cdee47ab2ca72a13357d1595f3c4ea52b9e7b))

## [1.0.3](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.0.2...v1.0.3) (2025-12-10)

### 🐛 Bug Fixes

* upgrade npm to 11.5+ for OIDC trusted publishing ([6060f2c](https://github.com/carlonicora/nextjs-jsonapi/commit/6060f2ce5c70d7481e2e645a35af97da50488bb1))

## [1.0.2](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.0.1...v1.0.2) (2025-12-10)

### 🐛 Bug Fixes

* add NPM_CONFIG_PROVENANCE env var for OIDC ([10c0928](https://github.com/carlonicora/nextjs-jsonapi/commit/10c0928058bd945fc05ec1b35c04f676849cb55d))

## [1.0.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.0.0...v1.0.1) (2025-12-10)

### 🐛 Bug Fixes

* enable provenance for npm OIDC publishing ([a5373f0](https://github.com/carlonicora/nextjs-jsonapi/commit/a5373f0bc9b003fc1893c1c55bc16e1abf1be4da))

## 1.0.0 (2025-12-09)

### 🚀 Features

* add CI/CD for npm publishing ([404e3c3](https://github.com/carlonicora/nextjs-jsonapi/commit/404e3c3e48f44c373fb003c9ac41bb8d228dc170))
* add CI/CD for npm publishing ([dfe1100](https://github.com/carlonicora/nextjs-jsonapi/commit/dfe1100aae5f1cf48d518058c8bf6b8831916e5b))
* add company configurations ([17f8eb6](https://github.com/carlonicora/nextjs-jsonapi/commit/17f8eb657e1d1d888ae7008666613b8ffec9b633))
* add components and utility functions ([a19c14a](https://github.com/carlonicora/nextjs-jsonapi/commit/a19c14aec8c4bf6256f3d1a584ace5f11a3e7228))
* add ESLint and Prettier configuration files with necessary dependencies ([8a63190](https://github.com/carlonicora/nextjs-jsonapi/commit/8a6319035f54dba3b0f8b049c8b903bcc0a35670))
* add hooks functions ([95279d1](https://github.com/carlonicora/nextjs-jsonapi/commit/95279d156a3c84e3487e66edbe02f45f01296c69))
* add module bootstrapping ([89a1da7](https://github.com/carlonicora/nextjs-jsonapi/commit/89a1da70828e57b7e46680d7c2ea0b4df52c7898))
* add next-intl support and new resizable components ([cc846ae](https://github.com/carlonicora/nextjs-jsonapi/commit/cc846aeeba4f58d1d0b18e65c34d266e86aadf42))
* add permissions module with rehydration and permission checks ([ff933e3](https://github.com/carlonicora/nextjs-jsonapi/commit/ff933e3ae98e468e63e32b8189e309ffb1895569))
* add README ([9f447bf](https://github.com/carlonicora/nextjs-jsonapi/commit/9f447bf811f1f5569696de44503e70d814bbeb74))
* add shadcnui components ([f614db0](https://github.com/carlonicora/nextjs-jsonapi/commit/f614db005ddb6fc14a06d2f5bd970b653518e37c))
* initial package setup with JSON:API client utilities ([c08b8f9](https://github.com/carlonicora/nextjs-jsonapi/commit/c08b8f911afdf2f2123ae1a0c7d9b547b2694cb5))

### 🐛 Bug Fixes

* add semantic-release deps and fix CI ([4c00010](https://github.com/carlonicora/nextjs-jsonapi/commit/4c00010a70a2f2dc7552b764d6def8af70806734))
* correct default language ([c7a9a6b](https://github.com/carlonicora/nextjs-jsonapi/commit/c7a9a6baea902caf12d4b4c0397f01daf789cbb3))
* correct module retrieval ([ececb78](https://github.com/carlonicora/nextjs-jsonapi/commit/ececb786a8173541b40554c8556f99a518d0ec84))
* correct page container UX ([f5def20](https://github.com/carlonicora/nextjs-jsonapi/commit/f5def209c1f209d9b55498bc8187c508be5fffbc))
* remove unused params ([78d9667](https://github.com/carlonicora/nextjs-jsonapi/commit/78d96676406f52fad86a13951126b5a9db34d652))
* rename S3.ts to s3.ts for case-sensitive filesystems ([54f8e38](https://github.com/carlonicora/nextjs-jsonapi/commit/54f8e3814d5e160daf735cbd611da24a6255e7a9))
* simplify error handling in fetch functions and remove unused parameters ([09c5f08](https://github.com/carlonicora/nextjs-jsonapi/commit/09c5f08574b36ee96be1e1c4c25f5fda184c1ae0))

### 📚 Documentation

* update documentation ([9533615](https://github.com/carlonicora/nextjs-jsonapi/commit/95336152ff77c205d9f32ce6369b57f34a407138))

### 📦 Code Refactoring

* move AllowedUsersDetails to nextjs-jsonapi ([fe2ebd6](https://github.com/carlonicora/nextjs-jsonapi/commit/fe2ebd69baba469067a1a858f2978d4d412550d4))
* move AllowedUsersDetails to nextjs-jsonapi ([419ad4d](https://github.com/carlonicora/nextjs-jsonapi/commit/419ad4dc293e8a8a244aefaeec549de91f240ab6))
* move blocknotejs to nextjs-jsonapi ([3eb940e](https://github.com/carlonicora/nextjs-jsonapi/commit/3eb940edbe1bbdc607849f0ef8ff6496f4b0211a))
* move common components in nextjs-jsonapi ([1af2d8f](https://github.com/carlonicora/nextjs-jsonapi/commit/1af2d8f9a51e13798f41977b78bf77d07a5dc3e8))
* move common forms to nextjs-jsonapi ([86c367f](https://github.com/carlonicora/nextjs-jsonapi/commit/86c367fe9e391768135e075fd8cfe50eb5137e14))
* move CommonAssociation to nextjs-jsonapi ([ca2d9a7](https://github.com/carlonicora/nextjs-jsonapi/commit/ca2d9a7e78395b6d456f5b66e9f8570a6d63b61d))
* move ContentTitle to nextjs-jsonapi ([92006fa](https://github.com/carlonicora/nextjs-jsonapi/commit/92006fa83aacce652989a4743ae92d68d94a5416))
* move ContributorsList to nextjs-jsonapi ([6586691](https://github.com/carlonicora/nextjs-jsonapi/commit/6586691719fdffd7cc689d707afe59a53e499935))
* move current user context in nextjs-jsonapi ([a1d1d4c](https://github.com/carlonicora/nextjs-jsonapi/commit/a1d1d4cd037ec2d3ad29a726c47f236e88f13f82))
* move d3 to nextjs-jsonapi ([588db56](https://github.com/carlonicora/nextjs-jsonapi/commit/588db56262fc7b82940ec138fa5dbe868b431db4))
* move ErrorDetails to nextjs-jsonapi ([b466259](https://github.com/carlonicora/nextjs-jsonapi/commit/b466259bfc540b2fae2bb986abbb03d3581e6dbf))
* move foundation data to nextjs-jsonapi ([3f5fedb](https://github.com/carlonicora/nextjs-jsonapi/commit/3f5fedbe7953cdafe61ccc4f7d8e346675d89965))
* move ReactMarkdownContainer to nextjs-jsonapi ([f0d3498](https://github.com/carlonicora/nextjs-jsonapi/commit/f0d349875b94f47272fc3289ac2433f622830d43))
* move recent pages to nextjs-jsonapi ([cd67803](https://github.com/carlonicora/nextjs-jsonapi/commit/cd678036aeab2fd0b87a039a89f794259a168902))
* move table structure to nextjs-jsonapi ([1c6f37e](https://github.com/carlonicora/nextjs-jsonapi/commit/1c6f37e607c9dd666a52764dba65a7bba24dbf17))
* move TabsContainer to nextjs-jsonapi ([b10678c](https://github.com/carlonicora/nextjs-jsonapi/commit/b10678cc04d6f1de05aff4a357b117e0ca550d80))
* move UserAvatar to nextjs-jsonapi ([f58b429](https://github.com/carlonicora/nextjs-jsonapi/commit/f58b429252acdab102842e46ce89271d5461d374))
* remove i18n module and related dependencies ([a99e2f5](https://github.com/carlonicora/nextjs-jsonapi/commit/a99e2f5f855e2ba192eebf9f70f190fb9799910c))

# Changelog
