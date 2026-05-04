## [1.85.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.84.0...v1.85.0) (2026-05-04)

### 🚀 Features

* **forms:** add hideSubmit prop to EditorSheet ([77a52fc](https://github.com/carlonicora/nextjs-jsonapi/commit/77a52fc09bd049d6f871a87dc85abc5d28d87b2f))

## [1.84.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.83.0...v1.84.0) (2026-05-04)

### 🚀 Features

* **components:** enhance RoundPageContainer with cookie management for details visibility ([900801b](https://github.com/carlonicora/nextjs-jsonapi/commit/900801bfa12878bea95419ece37aa09861fe0237))

## [1.83.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.82.0...v1.83.0) (2026-05-04)

### 🚀 Features

* **components:** enhance RoundPageContainer with improved tab structure and child rendering ([94c7b57](https://github.com/carlonicora/nextjs-jsonapi/commit/94c7b57803dd5f6764eedce33eb939523bffc069))

## [1.82.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.81.0...v1.82.0) (2026-05-03)

### 🚀 Features

* **components:** add ContentListGrid primitive and onSuccess on CommonDeleter ([15669d7](https://github.com/carlonicora/nextjs-jsonapi/commit/15669d75d4f020777f88b99c99bf207650d4ddc7))

## [1.81.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.80.0...v1.81.0) (2026-04-26)

### 🚀 Features

* **rbac:** add role-centric RBAC administration container ([ebb246d](https://github.com/carlonicora/nextjs-jsonapi/commit/ebb246d74f1f53dd569861b0b92489f3b0bdc40b))

## [1.80.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.79.0...v1.80.0) (2026-04-26)

### 🚀 Features

* **assistant-message:** tabbed message sources panel with library-side fetch ([66d874d](https://github.com/carlonicora/nextjs-jsonapi/commit/66d874d0e5a65f7723b06dcd93cba130eaea6c96))
* group assistant and responder agents in a single call ([31fbc4b](https://github.com/carlonicora/nextjs-jsonapi/commit/31fbc4be72add6123fb23a50cbd813fe716766ae))

## [1.79.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.78.0...v1.79.0) (2026-04-25)

### 🚀 Features

* **rbac:** declarative matrix UI with sidebar + detail layout ([dc72151](https://github.com/carlonicora/nextjs-jsonapi/commit/dc72151aedda7f02b7ae7f4a071ead0954ed309a))

### 💎 Styles

* **rbac:** prettier reformat ([38e5d39](https://github.com/carlonicora/nextjs-jsonapi/commit/38e5d39839efcccec4046b225f8f52c833df34cc))

## [1.78.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.77.3...v1.78.0) (2026-04-23)

### 🚀 Features

* **assistant-message:** add buildOptimistic factory for optimistic UI echo ([d99495c](https://github.com/carlonicora/nextjs-jsonapi/commit/d99495c5dac2d310b7b99db707d3c8cf9bbedf14))
* **assistant:** add failedMessageIds + retrySend to context value ([467f883](https://github.com/carlonicora/nextjs-jsonapi/commit/467f883920b6e307d8fe043811eb5be68ec5a920))
* **assistant:** chat UI redesign — polymorphic refs, thread context, sidebar ([271698c](https://github.com/carlonicora/nextjs-jsonapi/commit/271698c0d25d4cf43b2592058b4609967e6df7a9))
* **assistant:** error affordance + retry control on failed user messages ([6907c40](https://github.com/carlonicora/nextjs-jsonapi/commit/6907c4078a9b42f3e4183856a9349bd856667840))
* **assistant:** optimistic user-message echo on append ([edce9dd](https://github.com/carlonicora/nextjs-jsonapi/commit/edce9dd773c6bb4b7d1b26f0bb6a5056875c5079))
* **assistant:** track failed optimistic sends + support retrySend ([3546f1b](https://github.com/carlonicora/nextjs-jsonapi/commit/3546f1b3406438bb5bb085c76ad55eba4802e7d9))
* **features/assistant:** chat UI as library feature ([281225b](https://github.com/carlonicora/nextjs-jsonapi/commit/281225bf3991be129b4fa2589954e0d17a388d2f))

### 🐛 Bug Fixes

* **assistant:** clear messages and reset URL on startNew ([264d80d](https://github.com/carlonicora/nextjs-jsonapi/commit/264d80d2129474a9e7d95e21e9ab3d436efb3001))
* **assistant:** enhance AssistantProvider with breadcrumbs and title generation ([60751b6](https://github.com/carlonicora/nextjs-jsonapi/commit/60751b60397eb7912c51fab7716cfbb58243e947))
* **assistant:** resolve current user null issue on token update and enhance thread view logic ([c712961](https://github.com/carlonicora/nextjs-jsonapi/commit/c7129614bf6ffce974521b184406089f5d10dd12))
* **auth:** stop wiping currentUser when token cookie is absent ([5782632](https://github.com/carlonicora/nextjs-jsonapi/commit/578263208d1e0b269bb6174ab320b3328460d508))
* **MessageItem:** streamline retry button implementation for failed messages ([3ec6755](https://github.com/carlonicora/nextjs-jsonapi/commit/3ec6755f04e9417fd8e2f693e2f87ca7dd7a6660))

### 💎 Styles

* **assistant-context:** drop unused react-hooks/exhaustive-deps disable ([69ac00e](https://github.com/carlonicora/nextjs-jsonapi/commit/69ac00ef173e2b143b466cd852ade836b6a74a98))
* **assistant:** prettier auto-format carry-over from lint --fix ([a335f38](https://github.com/carlonicora/nextjs-jsonapi/commit/a335f385f34c1e8002a5e01a75ffb39e8260be56))
* **features/assistant:** format via lint --fix ([cc99ed0](https://github.com/carlonicora/nextjs-jsonapi/commit/cc99ed031e8a23ab89781f523ea0476d2263eae8))

### 📦 Code Refactoring

* **assistant:** fix server/client boundary — dehydrate props, drop AssistantsView middleman ([42dcc88](https://github.com/carlonicora/nextjs-jsonapi/commit/42dcc887e3405bf4552c461efcf8a99289c0d993))
* **auth:** await updateToken before writing userAtom in refreshUser ([ccc425d](https://github.com/carlonicora/nextjs-jsonapi/commit/ccc425dac55ff0f7ba74d2f132a1f25093b1a607))
* **tests:** simplify JSX structure in CurrentUserContext tests ([337a0c7](https://github.com/carlonicora/nextjs-jsonapi/commit/337a0c79ca6db9c82cace8c592920521d1f09fd5))

### 🚨 Tests

* **assistant:** lock in optimistic echo for first-message (new-thread) flow ([502b738](https://github.com/carlonicora/nextjs-jsonapi/commit/502b7384165338217d24d8f99b3c0337c29f68bf))

## [1.77.3](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.77.2...v1.77.3) (2026-04-16)

### 🐛 Bug Fixes

* avoid errors on empty vapid keys ([1e75d01](https://github.com/carlonicora/nextjs-jsonapi/commit/1e75d01366ebe11609bf0970d11e3ac5227ec5b9))

## [1.77.2](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.77.1...v1.77.2) (2026-04-14)

### ♻️ Chores

* update Node.js version to 24 and remove npm upgrade step ([fc60455](https://github.com/carlonicora/nextjs-jsonapi/commit/fc604551bacab5c85df142785d233a8dcfb60fa8))

## [1.77.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.77.0...v1.77.1) (2026-03-31)

### 📦 Code Refactoring

* consolidate imports from contexts and adjust spacing in RoundPageContainer ([672fbbc](https://github.com/carlonicora/nextjs-jsonapi/commit/672fbbc798bf58be2a6dd14c5040e7f3d1ff10e5))

## [1.77.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.76.0...v1.77.0) (2026-03-30)

### 🚀 Features

* update EditorSheetProps to use ReactNode for title and description ([3fbdf96](https://github.com/carlonicora/nextjs-jsonapi/commit/3fbdf9693d610f68466dc11a253094a626ec975d))

## [1.76.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.75.0...v1.76.0) (2026-03-28)

### 🚀 Features

* add useRef to track dialog open state in EditorSheet and reset form accordingly ([e472bb5](https://github.com/carlonicora/nextjs-jsonapi/commit/e472bb5c93264c71fa63b865796df5dd1857e628))

## [1.75.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.74.0...v1.75.0) (2026-03-26)

### 🚀 Features

* implement EntityMultiSelector component and integrate into forms ([f3cbf8e](https://github.com/carlonicora/nextjs-jsonapi/commit/f3cbf8e0721d7ef8e479e67e97db6e1e5870b842))
* refactor HowToMultiSelector and UserMultiSelect to use EntityMultiSelector component ([8f7eb68](https://github.com/carlonicora/nextjs-jsonapi/commit/8f7eb688836206d6f4ee968979442a3159f2ccec))

## [1.74.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.73.0...v1.74.0) (2026-03-26)

### 🚀 Features

* add identifier getter to ApiDataInterface ([b9fc43c](https://github.com/carlonicora/nextjs-jsonapi/commit/b9fc43c2c21101506e677f63bf92a9eab5aadab0))
* add identifier getter to mock classes and update createMockApiData function ([645fb48](https://github.com/carlonicora/nextjs-jsonapi/commit/645fb485a668d7e02b630e0b40d6d2f2ebcd7a8e))
* add identifier param to ModuleFactory type ([c40544c](https://github.com/carlonicora/nextjs-jsonapi/commit/c40544c7669130ea212ecaf14734edb0fedb51c4))

### 🐛 Bug Fixes

* add identifier to mock objects in useRbacState test ([a2b9681](https://github.com/carlonicora/nextjs-jsonapi/commit/a2b9681bf698385de6f5cba3a6337309b2948b5a))
* wrap RecentPagesNavigator dropdown in DropdownMenuGroup ([3b9dc06](https://github.com/carlonicora/nextjs-jsonapi/commit/3b9dc06bce505f037c1ffc57fa5da139dda6403c))

### 🚨 Tests

* add unit tests for AbstractApiData.identifier getter ([05b401b](https://github.com/carlonicora/nextjs-jsonapi/commit/05b401b7396a587ff80ba471dd1f32c7dce7c465))

## [1.73.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.72.0...v1.73.0) (2026-03-26)

### 🚀 Features

* add findByFeature method to ModuleRegistryClass for module retrieval by feature ([8859fd5](https://github.com/carlonicora/nextjs-jsonapi/commit/8859fd563e25e73bb35b569c174c87a9b1ce2c06))
* add optional icon field to SharedContext title ([e518a3e](https://github.com/carlonicora/nextjs-jsonapi/commit/e518a3e6d16f22ee3fad5272f820f133161a2370))

## [1.72.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.71.0...v1.72.0) (2026-03-23)

### 🚀 Features

* add optional title and description override props to EditorSheet ([8ea473a](https://github.com/carlonicora/nextjs-jsonapi/commit/8ea473a116910775a8a14dfc1e3efb18eda41077))

### 💎 Styles

* auto-format EditorSheet ([f18aaf4](https://github.com/carlonicora/nextjs-jsonapi/commit/f18aaf45aa128960a434c21152e05671189e2a0c))

## [1.71.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.70.0...v1.71.0) (2026-03-19)

### 🚀 Features

* **lib:** add HeaderLeftContentContext for header left slot ([94d9b91](https://github.com/carlonicora/nextjs-jsonapi/commit/94d9b91fd79d1a601560f8c7819319226f9bdc8f))
* **lib:** add hideChevron prop to NavigationMenuTrigger ([ea4efbf](https://github.com/carlonicora/nextjs-jsonapi/commit/ea4efbfca861a8995fb265a1b050af673244c45a))
* **lib:** add leftContent prop to Header component ([283d0fb](https://github.com/carlonicora/nextjs-jsonapi/commit/283d0fb13815dcdd609e133493d93794cfabfe75))
* **lib:** wire HeaderLeftContentContext into page containers ([129202e](https://github.com/carlonicora/nextjs-jsonapi/commit/129202ef621c17299e7499c3ec8b37eac99a328c))

### 💎 Styles

* format Header component for better readability ([52514b5](https://github.com/carlonicora/nextjs-jsonapi/commit/52514b5b0a5c03b9ea88327767077e43e8381fa3))

## [1.70.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.69.0...v1.70.0) (2026-03-19)

### 🚀 Features

* add isRequired prop to FormSelect ([73a7742](https://github.com/carlonicora/nextjs-jsonapi/commit/73a77421e598ecd786020787903f1337317d11fc))
* **nextjs-jsonapi:** add inlineContentSpecs and renderOverlays props to BlockNoteEditor ([df9cc07](https://github.com/carlonicora/nextjs-jsonapi/commit/df9cc07cae80c47e10d294585caae204a0e0e5ac))

## [1.69.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.68.0...v1.69.0) (2026-03-18)

### 🚀 Features

* **how-to:** adapt interface and model to extend Content ([e2b6ca5](https://github.com/carlonicora/nextjs-jsonapi/commit/e2b6ca5afb44f4a507c7034d9488593944600c46))
* **how-to:** adapt service with library-relative imports ([ac5187e](https://github.com/carlonicora/nextjs-jsonapi/commit/ac5187e3e6d1e4bba95fd77112325caac5373650))
* **how-to:** add fields, module, barrel exports and registry ([62dcb9d](https://github.com/carlonicora/nextjs-jsonapi/commit/62dcb9d6a623f4b0cf3052515d06938d6e289cdc))
* **how-to:** add fullWidth prop to HowToList and update HowToListContainer ([23bf6ef](https://github.com/carlonicora/nextjs-jsonapi/commit/23bf6efe198b1a98dad4299da78b0bd39d6fd65a))
* **how-to:** add moduleId and icon to HowToModule ([92b188b](https://github.com/carlonicora/nextjs-jsonapi/commit/92b188be4e49d641a765aff43c18dc6471ae3b46))
* **how-to:** add UI components with library-relative imports ([0367462](https://github.com/carlonicora/nextjs-jsonapi/commit/0367462bce964899ed425d3297047303b7ba6bbd))
* **how-to:** raw relocation of generated frontend module ([c5ac96d](https://github.com/carlonicora/nextjs-jsonapi/commit/c5ac96db22edee615727d227a97e6261c797566b))
* **how-to:** replace page text inputs with searchable dropdowns ([0f13ced](https://github.com/carlonicora/nextjs-jsonapi/commit/0f13ceda8f16889494e4b02178641a797620949c))
* **howto:** update pageUrl to administration path ([3512e31](https://github.com/carlonicora/nextjs-jsonapi/commit/3512e31788785f376734ffd6264a5fd438b6a1fb))

### 🐛 Bug Fixes

* **how-to:** remove permission check that hid create button ([f2fec91](https://github.com/carlonicora/nextjs-jsonapi/commit/f2fec91fb102fcc55f5a74a661503f165c2dda3c))
* use string type for HowTo table generator registration ([07df9d5](https://github.com/carlonicora/nextjs-jsonapi/commit/07df9d557cf0cb8532a9df176de832d1fb84f694))

### 💎 Styles

* auto-format HowTo files per linter rules ([6bfb455](https://github.com/carlonicora/nextjs-jsonapi/commit/6bfb455be539ebbb8bf129ac84c7a5347e617f0b))

### 📦 Code Refactoring

* **how-to:** use EditorSheet instead of custom Dialog in HowToEditor ([1c26470](https://github.com/carlonicora/nextjs-jsonapi/commit/1c264704aec6dcd081d34e07b99a643cccc60ba8))

## [1.68.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.67.0...v1.68.0) (2026-03-18)

### 🚀 Features

* use dedicated patchAvatar endpoint for user avatar updates ([5fef9a7](https://github.com/carlonicora/nextjs-jsonapi/commit/5fef9a74e1eb6ce20dbb226edbc476ed424cfd7e))

### 🐛 Bug Fixes

* pass all user fields in avatar update to prevent data wipe ([b2325d7](https://github.com/carlonicora/nextjs-jsonapi/commit/b2325d73df40a128f38f842c6b017c980e0e7886))
* use UserService.update with required fields for avatar patching ([419d292](https://github.com/carlonicora/nextjs-jsonapi/commit/419d292b4dc70428f41e2cf9113b11520bb14a90))

## [1.67.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.66.0...v1.67.0) (2026-03-16)

### 🚀 Features

* move EditableAvatar component to nextjs-jsonapi library ([163a570](https://github.com/carlonicora/nextjs-jsonapi/commit/163a5701b6c7f4ae2e5155c9d939157189177b68))
* replace UserDetails with UserContent following modern Content pattern ([c2462db](https://github.com/carlonicora/nextjs-jsonapi/commit/c2462dba6bbf1cc74a9360c7a4b7c3cb3f4ac100))

### 🐛 Bug Fixes

* **company:** streamline company update/create logic in CompanyEditorInternal ([5866190](https://github.com/carlonicora/nextjs-jsonapi/commit/58661909a832a2be006ebb742e5ae1c195a47608))
* make User.createJsonApi conditional and add UserService.patch for safe partial updates ([87b83a6](https://github.com/carlonicora/nextjs-jsonapi/commit/87b83a6e0543b55ca126ab92266b4d8a1e6dc033))

### 📦 Code Refactoring

* **role:** improve layout and accessibility in FormRoles component ([bef3e4f](https://github.com/carlonicora/nextjs-jsonapi/commit/bef3e4f72afb18b4c96f92deb89b2394c988216a))
* update user components ([cf2ebef](https://github.com/carlonicora/nextjs-jsonapi/commit/cf2ebef44508c3338647d901a6b2506267bbf8af))
* **user:** enhance UserEditor component structure and logic for better maintainability ([0ee2e06](https://github.com/carlonicora/nextjs-jsonapi/commit/0ee2e062a98b9f02aa9275a9c57b0c7a554ff929))

## [1.66.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.65.1...v1.66.0) (2026-03-15)

### 🚀 Features

* add shared fiscal data components and utilities ([8610923](https://github.com/carlonicora/nextjs-jsonapi/commit/8610923e452d982bf8d6a1734682d573cb287eb8))
* **company:** add address and fiscal_data fields to interface ([5524663](https://github.com/carlonicora/nextjs-jsonapi/commit/5524663bdc69c9ee36eee29a5b7f6429a1c0cc74))
* **company:** add address and fiscal_data to model rehydrate/createJsonApi ([5605608](https://github.com/carlonicora/nextjs-jsonapi/commit/5605608a6d54d6a17561307c7b5d4c43391a6157))
* **company:** add CompanyContent display component and integrate into CompanyDetails ([8d20067](https://github.com/carlonicora/nextjs-jsonapi/commit/8d200678ba9e31c6ce21d36287952ef46182cd49))
* **company:** enhance CompanyContent with logo and actions support ([904189e](https://github.com/carlonicora/nextjs-jsonapi/commit/904189eb5c1810dd6c5b7b356f617ca8bbe38d2e))
* **company:** extend CompanyEditor with address and fiscal data fields ([843c40a](https://github.com/carlonicora/nextjs-jsonapi/commit/843c40ace800500dc851848b9f16cddaa43378c3))

### 🐛 Bug Fixes

* add h-full class to container for consistent height ([acfa55b](https://github.com/carlonicora/nextjs-jsonapi/commit/acfa55b766b4b7cd091973b31f64896861ff6449))
* **navigation:** update DropdownMenuTrigger to use render prop for better compatibility ([14eb69b](https://github.com/carlonicora/nextjs-jsonapi/commit/14eb69b36ce92d88184c0a133884131023534d0c))

### 💎 Styles

* apply linter formatting to fiscal components ([25ed230](https://github.com/carlonicora/nextjs-jsonapi/commit/25ed230152778c7b88824e46c06d3ccebf45d506))
* **company:** improve formatting and consistency in CompanyContent component ([c01fbf8](https://github.com/carlonicora/nextjs-jsonapi/commit/c01fbf82cfabe36868637babe8b2ac8fcdf4bc1f))

### 📦 Code Refactoring

* **company:** simplify CompanyEditor and CompanyConfigurationEditor components with EditorSheet integration ([6b25878](https://github.com/carlonicora/nextjs-jsonapi/commit/6b2587830ccbd9dda991bbb7716b2d11ced076b9))

## [1.65.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.65.0...v1.65.1) (2026-03-14)

### 🐛 Bug Fixes

* increase ITEMS_TO_DISPLAY from 3 to 4 for improved navigation ([80b9fdc](https://github.com/carlonicora/nextjs-jsonapi/commit/80b9fdc5cef4bf67b30d49243dc03fb1eb49e656))

## [1.65.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.64.0...v1.65.0) (2026-03-13)

### 🚀 Features

* **audit-log:** add audit log module, service, and interface ([f88d625](https://github.com/carlonicora/nextjs-jsonapi/commit/f88d6256cf6074105a983ddb697e3dbf2283dbf5))

## [1.64.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.63.0...v1.64.0) (2026-03-13)

### 🚀 Features

* **company:** add Building2Icon to CompanyModule ([9f9548f](https://github.com/carlonicora/nextjs-jsonapi/commit/9f9548f794c3e78bb2cfec75d5e7a77d8fbb59fa))
* **company:** add configurationEditorSlot to CompanyProvider and CompanyContainer ([039da4b](https://github.com/carlonicora/nextjs-jsonapi/commit/039da4b1059224a6e194783585aa7360d7bbb316))
* **company:** enhance CompanyDetails with TokenStatusIndicator and config display ([477c80c](https://github.com/carlonicora/nextjs-jsonapi/commit/477c80ca3ab84378472586094b1d2f734af3e3ff))
* **company:** refactor CompanyConfigurationEditor to use props for default values and form schema ([bcd2b33](https://github.com/carlonicora/nextjs-jsonapi/commit/bcd2b3378810c4de673e1866ad3b34ace94f7da3))
* **company:** remove CompanyConfigurationRegionalForm component ([8df6995](https://github.com/carlonicora/nextjs-jsonapi/commit/8df6995f0744d077eb35a91b65f26d81cba31b1e))
* **company:** replace config editor with country/currency regional settings ([5933eb9](https://github.com/carlonicora/nextjs-jsonapi/commit/5933eb90c3992294b59ec5fae3990d7daeb2e0c5))
* **user:** add UsersIcon to UserModule ([8662151](https://github.com/carlonicora/nextjs-jsonapi/commit/8662151e4c521c24b1fc533ea47fbf205dce4219))

### 💎 Styles

* apply lint formatting fixes ([7f1d4b1](https://github.com/carlonicora/nextjs-jsonapi/commit/7f1d4b112b02260c4f405ffe80d9f47702be2b34))

## [1.63.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.62.0...v1.63.0) (2026-03-13)

### 🚀 Features

* **Selector:** enhance search functionality and update UI components ([5b64fa0](https://github.com/carlonicora/nextjs-jsonapi/commit/5b64fa0f98e78ab3bac2faf50705fb40b9ae0a44))

## [1.62.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.61.1...v1.62.0) (2026-03-12)

### 🚀 Features

* **TableCellAvatar:** add className prop for customizable styling ([79a80a3](https://github.com/carlonicora/nextjs-jsonapi/commit/79a80a3364d1b859aef4eb11fb5cfd1802e42e24))

## [1.61.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.61.0...v1.61.1) (2026-03-12)

### 💎 Styles

* **sheet:** add rounded corners to left/right side sheets ([89335ad](https://github.com/carlonicora/nextjs-jsonapi/commit/89335ad8af86d2bff3de5c974d92cb8374a40822))

## [1.61.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.60.0...v1.61.0) (2026-03-11)

### 🚀 Features

* add EditorSheet reusable component to nextjs-jsonapi ([7923b27](https://github.com/carlonicora/nextjs-jsonapi/commit/7923b279661ac0f01060b2857bf3a74f9f9d1bae))

### 🚨 Tests

* add EditorSheet component tests ([6b50283](https://github.com/carlonicora/nextjs-jsonapi/commit/6b50283ae8fd1fe52cb5cc88c782958d13f0761d))

## [1.60.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.59.0...v1.60.0) (2026-03-10)

### 🚀 Features

* **nextjs-jsonapi:** add CommonEditorDiscardDialog component ([2a0b8dd](https://github.com/carlonicora/nextjs-jsonapi/commit/2a0b8ddcb2f5ad12cab41a4ff3026da06d4ed681))
* **nextjs-jsonapi:** add useEditorDialog hook for centralized editor dialog state ([019a549](https://github.com/carlonicora/nextjs-jsonapi/commit/019a5493aedfb9aaeb2f832a2a101369d9ac201c))
* **nextjs-jsonapi:** export new editor dialog utilities and update editor template ([48aa347](https://github.com/carlonicora/nextjs-jsonapi/commit/48aa3471b270af66dbc5da799266a966b05b19b9))

### 📦 Code Refactoring

* simplified content table title ([19a3d24](https://github.com/carlonicora/nextjs-jsonapi/commit/19a3d24f7369ae4d35a3f922237ff97188e78f6c))
* streamline useEditorDialog function signature ([2f99106](https://github.com/carlonicora/nextjs-jsonapi/commit/2f99106f34d57eba5206e859cf7c09a9b1e81837))

## [1.59.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.58.5...v1.59.0) (2026-03-10)

### 🚀 Features

* add forceHeader prop to RoundPageContainer and RoundPageContainerTitle for conditional rendering ([bb94d66](https://github.com/carlonicora/nextjs-jsonapi/commit/bb94d6617279e1f801accbe734dbe45151779237))

## [1.58.5](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.58.4...v1.58.5) (2026-03-09)

### 🐛 Bug Fixes

* format inputMode assignment for better readability ([a8826c2](https://github.com/carlonicora/nextjs-jsonapi/commit/a8826c2c65e87431cc75a77cd9ab5960e5d49f09))

## [1.58.4](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.58.3...v1.58.4) (2026-03-09)

### 🐛 Bug Fixes

* update FormInput to support decimal type and adjust test cases accordingly ([8864a85](https://github.com/carlonicora/nextjs-jsonapi/commit/8864a85797d5abe81ed1acbdd69296c2db0fe9f4))

## [1.58.3](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.58.2...v1.58.3) (2026-03-09)

### 🐛 Bug Fixes

* refine currency input handling and adjust input type attributes ([19d9cb1](https://github.com/carlonicora/nextjs-jsonapi/commit/19d9cb100e1ad90204c8982720fe3fbdf2f95a9d))

## [1.58.2](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.58.1...v1.58.2) (2026-03-08)

### 🚨 Tests

* update footer visibility test description and add title prop ([9bf40e0](https://github.com/carlonicora/nextjs-jsonapi/commit/9bf40e0384696d4e4a1c371bbe6a75e25d970e38))

## [1.58.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.58.0...v1.58.1) (2026-03-08)

### 📦 Code Refactoring

* **EntityAvatar, TableCellAvatar:** improve formatting and readability of component code ([3e617b2](https://github.com/carlonicora/nextjs-jsonapi/commit/3e617b21b4baa66c99d03fb3eb9166eabb45d941))

## [1.58.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.57.1...v1.58.0) (2026-03-08)

### 🚀 Features

* add EntityAvatar and TableCellAvatar components with initials fallback ([7acaafe](https://github.com/carlonicora/nextjs-jsonapi/commit/7acaafe0e45213b154049b9a8d4b1f12761074a0))

## [1.57.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.57.0...v1.57.1) (2026-03-08)

### 🐛 Bug Fixes

* **ContentListTable:** only show footer when pagination is available ([738a538](https://github.com/carlonicora/nextjs-jsonapi/commit/738a538d978d9ef36b4686f3c8d3aaf3a2bf5882))

## [1.57.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.56.2...v1.57.0) (2026-03-08)

### 🚀 Features

* **nextjs-jsonapi:** fetch Place Details for address components on selection ([f0e414f](https://github.com/carlonicora/nextjs-jsonapi/commit/f0e414f72be63e340a379b8a36096a873501f0c4))

### 🐛 Bug Fixes

* **FormPlaceAutocomplete:** streamline fetch request for address components ([1bbdd27](https://github.com/carlonicora/nextjs-jsonapi/commit/1bbdd27628dcf237586f563f32e7e7334906ec4b))

## [1.56.2](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.56.1...v1.56.2) (2026-03-06)

### 🐛 Bug Fixes

* **FormPlaceAutocomplete:** remove overly restrictive includedPrimaryTypes default ([b093d01](https://github.com/carlonicora/nextjs-jsonapi/commit/b093d01db9750f6b2afdc09eb735abea996eff76))

## [1.56.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.56.0...v1.56.1) (2026-03-03)

### 🐛 Bug Fixes

* **RoundPageContainer:** update tab handling to use activeTab state and improve key assignment ([75e5d46](https://github.com/carlonicora/nextjs-jsonapi/commit/75e5d4668678af2ff56ac33d980672f5dd7426d1))

## [1.56.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.55.2...v1.56.0) (2026-03-03)

### 🚀 Features

* **FormSelect:** add allowEmpty prop for clearable select fields ([fbfd37b](https://github.com/carlonicora/nextjs-jsonapi/commit/fbfd37bbce10a4b8dffdd0033ecf07e3e95285b7))

## [1.55.2](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.55.1...v1.55.2) (2026-03-03)

### 🐛 Bug Fixes

* match UserSelector trigger styling to Input component and use anchor-width for popover ([aec9692](https://github.com/carlonicora/nextjs-jsonapi/commit/aec9692dd7cda0cf957ab6eaaa4107c0661fd035))

## [1.55.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.55.0...v1.55.1) (2026-03-03)

### 🐛 Bug Fixes

* adjust title styling in AttributeElement for consistency ([f70f1d2](https://github.com/carlonicora/nextjs-jsonapi/commit/f70f1d2a9b9b3332e08ec96864066b6f0becf9ff))

## [1.55.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.54.1...v1.55.0) (2026-03-03)

### 🚀 Features

* add optional key property to Tab type for enhanced flexibility ([beb8c3a](https://github.com/carlonicora/nextjs-jsonapi/commit/beb8c3a0623f3b090fd6c6d1ce477b32e7858bcd))
* enhance RoundPageContainer with URL rewriting and default tab selection ([ebc795d](https://github.com/carlonicora/nextjs-jsonapi/commit/ebc795dcfe03ce661b55ec73c73cb08b0818f637))
* include additionalParameters in useUrlRewriter for improved URL generation ([b0874ad](https://github.com/carlonicora/nextjs-jsonapi/commit/b0874adea978f28c8e354a02a3f1b72858d61175))

## [1.54.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.54.0...v1.54.1) (2026-03-03)

### 🐛 Bug Fixes

* add onEmptyChange callback to FormBlockNote for handling empty state ([63a77e6](https://github.com/carlonicora/nextjs-jsonapi/commit/63a77e62df83d2709251e136812a4bb38b3ec305))

## [1.54.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.53.1...v1.54.0) (2026-03-03)

### 🚀 Features

* add FormBlockNote ([86dfca3](https://github.com/carlonicora/nextjs-jsonapi/commit/86dfca31916f97ec9022b392f00822ff95526fe5))
* add fullwidth option to round page container ([8b2209a](https://github.com/carlonicora/nextjs-jsonapi/commit/8b2209ae1062fff99227e892115c3d6a21402b8e))
* add fullwith to hide title and borders  in content list table ([08a30ad](https://github.com/carlonicora/nextjs-jsonapi/commit/08a30ad480c160fabb8ee8fa24c342e6a5443867))

## [1.53.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.53.0...v1.53.1) (2026-03-02)

### 🐛 Bug Fixes

* correct module generation ([348f479](https://github.com/carlonicora/nextjs-jsonapi/commit/348f4794b911c417f89d91540abd94f45f579944))

## [1.53.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.52.0...v1.53.0) (2026-03-02)

### 🚀 Features

* add rbac generator ([379fe69](https://github.com/carlonicora/nextjs-jsonapi/commit/379fe698ad62dfc960e4901484b98f57f011515d))

### 🐛 Bug Fixes

* correct container ([814439c](https://github.com/carlonicora/nextjs-jsonapi/commit/814439c17f9b57d7a9f6fb2fb3cc691a36ef93ec))

## [1.52.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.51.0...v1.52.0) (2026-02-25)

### 🚀 Features

* refactor templates and add alias support ([99a9918](https://github.com/carlonicora/nextjs-jsonapi/commit/99a991818d9bec45e11d982b2b497568ef2c067b))

### 🐛 Bug Fixes

* update class names for selected states in CommandItem and CommandShortcut ([d3393ab](https://github.com/carlonicora/nextjs-jsonapi/commit/d3393abd279585131c020120fadb5f458cfff6e6))

### 📦 Code Refactoring

* remove unnecessary line breaks in Header component ([9f157ad](https://github.com/carlonicora/nextjs-jsonapi/commit/9f157addd809c5ab960230a020f55a80f86fccee))
* simplify RoundPageContainer props and enhance children rendering ([da48c8e](https://github.com/carlonicora/nextjs-jsonapi/commit/da48c8e7c95bcdccc6419c2cec1eecc16b34e2d9))

## [1.51.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.50.0...v1.51.0) (2026-02-23)

### 🚀 Features

* add round page container ([1785d1f](https://github.com/carlonicora/nextjs-jsonapi/commit/1785d1fe249cef2ef16a9cea678fc3b5a32779a1))

### 🐛 Bug Fixes

* correct linting ([2986a39](https://github.com/carlonicora/nextjs-jsonapi/commit/2986a39df7c96f9daee14599d088897ec29b85dc))

## [1.50.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.49.0...v1.50.0) (2026-02-16)

### 🚀 Features

* enhance relationship handling with alias support and validation ([b0e2fe7](https://github.com/carlonicora/nextjs-jsonapi/commit/b0e2fe7f097fe329768a3889846caae80752113d))

### 🐛 Bug Fixes

* correct import of multi-entity schema ([9860306](https://github.com/carlonicora/nextjs-jsonapi/commit/9860306dd4cefe8b18516009423aedb57ed746ed))

## [1.49.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.48.3...v1.49.0) (2026-02-14)

### 🚀 Features

* add portal support for dropdown in MultipleSelector to improve rendering in overflow containers ([30e343a](https://github.com/carlonicora/nextjs-jsonapi/commit/30e343ac125747a7d379d225d731ee9b781d8610))

### 🐛 Bug Fixes

* add jotai dependencies to external list in tsup config ([8403e71](https://github.com/carlonicora/nextjs-jsonapi/commit/8403e712d91cf04fce7460d1de3b4d98819be0c0))

## [1.48.3](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.48.2...v1.48.3) (2026-02-12)

### 🐛 Bug Fixes

* add group class to TableRow for improved hover effects ([9d7edfa](https://github.com/carlonicora/nextjs-jsonapi/commit/9d7edfab9dbd4a419929be84181d2fa640919d54))
* allow overwriting existing table generator hooks in TableGeneratorRegistry ([8481b39](https://github.com/carlonicora/nextjs-jsonapi/commit/8481b3901f4d59b3640ce9a9251a62a77d1c2f9e))

### 💎 Styles

* update flex alignment in ContentTitle component ([14e47c6](https://github.com/carlonicora/nextjs-jsonapi/commit/14e47c6bd700b270844fc998cc0510ef5bcdd950))

### ♻️ Chores

* add @handlewithcare/prosemirror-inputrules dependency ([3d1d9be](https://github.com/carlonicora/nextjs-jsonapi/commit/3d1d9be1d3e31bf078270654d484a77a0cca73d1))

## [1.48.2](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.48.1...v1.48.2) (2026-02-11)

### 🐛 Bug Fixes

* remove UserTopic and UserExpertise from FoundationModuleDefinitions ([e0253c7](https://github.com/carlonicora/nextjs-jsonapi/commit/e0253c7a4749bf04ec439c5b8584489a09ebb1d9))

## [1.48.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.48.0...v1.48.1) (2026-02-11)

### 🐛 Bug Fixes

* add type annotation for onClick event in UserAvatarList component ([1da935f](https://github.com/carlonicora/nextjs-jsonapi/commit/1da935f962f50f1efe5e64ba9910aeffd8d09f4a))
* export UserAvatarList component from widgets index ([07aa56b](https://github.com/carlonicora/nextjs-jsonapi/commit/07aa56b7fee88a61993d0c72ecbfde667d07ec0c))

## [1.48.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.47.2...v1.48.0) (2026-02-11)

### 🚀 Features

* refactor multi-selector component and improve user multi-select functionality ([f397a28](https://github.com/carlonicora/nextjs-jsonapi/commit/f397a283a7095c172f87fdc813a67b28ff805fb3))

### 🐛 Bug Fixes

* add missing commas in function parameters and JSX elements for consistency ([f40444b](https://github.com/carlonicora/nextjs-jsonapi/commit/f40444b5255b310d3aaf3e3e0a33a9c2dba05dd5))

## [1.47.2](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.47.1...v1.47.2) (2026-02-11)

### 🐛 Bug Fixes

* simplify default expanded state handling in ContentListTable ([a8c59de](https://github.com/carlonicora/nextjs-jsonapi/commit/a8c59deef2322d2c9c52d6de647236fafbf97fff))
* update default expanded state handling in ContentListTable ([2a02f83](https://github.com/carlonicora/nextjs-jsonapi/commit/2a02f839282b80fd4db82ab362bc6cfd9a0bcd08))

## [1.47.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.47.0...v1.47.1) (2026-02-11)

### 🐛 Bug Fixes

* remove console logs ([3ad6160](https://github.com/carlonicora/nextjs-jsonapi/commit/3ad6160d67facebedf48883543fd034487a53058))

## [1.47.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.46.1...v1.47.0) (2026-02-11)

### 🚀 Features

* implement polymorphic relationship handling in AbstractApiData and add tests for DataClassRegistry ([aaef94b](https://github.com/carlonicora/nextjs-jsonapi/commit/aaef94b64fa0dc8b5cbfbf082897c14da2c17f78))

## [1.46.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.46.0...v1.46.1) (2026-02-10)

### 🐛 Bug Fixes

* simplify date cell rendering in cellDate component ([d28de65](https://github.com/carlonicora/nextjs-jsonapi/commit/d28de657d898f58c11a6ab0577bb39d5085928f6))

## [1.46.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.45.4...v1.46.0) (2026-02-10)

### 🚀 Features

* add expandable rows and improve date cell rendering in ContentListTable ([08f75c3](https://github.com/carlonicora/nextjs-jsonapi/commit/08f75c3e7f567c583ec4f95ffdcd1fca22cf5829))

## [1.45.4](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.45.3...v1.45.4) (2026-02-09)

### 🐛 Bug Fixes

* remove unnecessary bottom padding from PageContainer main element ([0454fb8](https://github.com/carlonicora/nextjs-jsonapi/commit/0454fb8e8d4cf34080195fa6987a6ce1a996cb2d))

## [1.45.3](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.45.2...v1.45.3) (2026-02-07)

### 🐛 Bug Fixes

* add optional 'include' field to ApiRequestDataTypeInterface and ModuleWithPermissions ([c6fccae](https://github.com/carlonicora/nextjs-jsonapi/commit/c6fccae59b9ee1c0d549e9b565ee6bfcb3008a2a))

## [1.45.2](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.45.1...v1.45.2) (2026-02-06)

### 🐛 Bug Fixes

* update next-intl to version 4.8.2 ([1fc5eb8](https://github.com/carlonicora/nextjs-jsonapi/commit/1fc5eb898d38f98ea6fe2ae0daf75965e953e27d))

## [1.45.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.45.0...v1.45.1) (2026-02-05)

### 🐛 Bug Fixes

* update react and react-dom to version 19.2.4 ([ca8021f](https://github.com/carlonicora/nextjs-jsonapi/commit/ca8021f46049ebf30cf38d4a7d93b2160a189b5e))

## [1.45.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.44.2...v1.45.0) (2026-02-05)

### 🚀 Features

* add oauth referral tracking ([0ef3e49](https://github.com/carlonicora/nextjs-jsonapi/commit/0ef3e4993d118a4ccf23a14443ce0405c1ebdd36))
* add referral feature ([b1d7d1b](https://github.com/carlonicora/nextjs-jsonapi/commit/b1d7d1beeca7ae511eb7e7c1ede47565adfc91d1))
* add referral support ([d7ed0f2](https://github.com/carlonicora/nextjs-jsonapi/commit/d7ed0f2df6be2f97ee58594a2787685d7c99abfa))

## [1.44.2](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.44.1...v1.44.2) (2026-02-01)

### 🐛 Bug Fixes

* add item context to settings translation in UserProvider ([9f00e23](https://github.com/carlonicora/nextjs-jsonapi/commit/9f00e234b2cb0036f1a41fc202294d4c3b8b92a3))
* remove duplicate switch from form switch ([8d0f6ad](https://github.com/carlonicora/nextjs-jsonapi/commit/8d0f6ad2253de9cdf94556a2183c266e75c594ac))

## [1.44.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.44.0...v1.44.1) (2026-02-01)

### 💎 Styles

* correct design of form switch and page content container ([2163553](https://github.com/carlonicora/nextjs-jsonapi/commit/216355338d8ae1355b144b2c42b4eb719e19efd8))

## [1.44.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.43.0...v1.44.0) (2026-02-01)

### 🚀 Features

* add standalone user details ([7947fa8](https://github.com/carlonicora/nextjs-jsonapi/commit/7947fa8e0700c5244279d0a09387d5a183828a61))

## [1.43.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.42.1...v1.43.0) (2026-01-31)

### 🚀 Features

* add testId prop to CommonDeleter and CommonEditorTrigger components ([beb43c6](https://github.com/carlonicora/nextjs-jsonapi/commit/beb43c663772fc254f885102fb1fe5c05e0b23b7))

## [1.42.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.42.0...v1.42.1) (2026-01-31)

### 🐛 Bug Fixes

* correct internationalisation ([2355e8a](https://github.com/carlonicora/nextjs-jsonapi/commit/2355e8a44ee3509fcaae3b30921e111c7f08391d))

## [1.42.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.41.3...v1.42.0) (2026-01-31)

### 🚀 Features

* add icon utilities export to index ([8744402](https://github.com/carlonicora/nextjs-jsonapi/commit/87444027a7d4f7657a1e2882db90008afc545049))

## [1.41.3](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.41.2...v1.41.3) (2026-01-30)

### 🐛 Bug Fixes

* correct module generator ([cb6c867](https://github.com/carlonicora/nextjs-jsonapi/commit/cb6c867a1718534a6ce412d3e4c0539d2b1af0f3))

## [1.41.2](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.41.1...v1.41.2) (2026-01-30)

### 📚 Documentation

* add claude.md files ([7a8b64d](https://github.com/carlonicora/nextjs-jsonapi/commit/7a8b64d2c8ca6103db9939cdf9e58f40596d530f))

## [1.41.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.41.0...v1.41.1) (2026-01-28)

### 📚 Documentation

* remove architecture guide and delegate it to main app ([2581417](https://github.com/carlonicora/nextjs-jsonapi/commit/2581417dfbd427c095e49c41acf434fedeaa9e79))

## [1.41.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.40.1...v1.41.0) (2026-01-27)

### 🚀 Features

* add 2fa ([1cace13](https://github.com/carlonicora/nextjs-jsonapi/commit/1cace13abe014a3a6d8759964e3d58cd343bfa68))

### 🐛 Bug Fixes

* correct 2fa ([0af3b6f](https://github.com/carlonicora/nextjs-jsonapi/commit/0af3b6f36f72365d320c3eb09194ec8fdf721beb))
* remove console logs ([c68f7d2](https://github.com/carlonicora/nextjs-jsonapi/commit/c68f7d20b287eaf53691d93e38fdaf450029753f))

## [1.40.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.40.0...v1.40.1) (2026-01-27)

### 📚 Documentation

* add architecture guide ([8144f76](https://github.com/carlonicora/nextjs-jsonapi/commit/8144f76280782e743a97bf591c80b7492a3b4f7e))

## [1.40.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.39.2...v1.40.0) (2026-01-26)

### 🚀 Features

* add waiting list ([b615b4c](https://github.com/carlonicora/nextjs-jsonapi/commit/b615b4c422b1982cab396d15e9dd7f2e983f5995))
* add waiting list ([d0aa8fe](https://github.com/carlonicora/nextjs-jsonapi/commit/d0aa8fef6cd62fb64df8a7dadb1010123435c38c))

## [1.39.2](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.39.1...v1.39.2) (2026-01-26)

### ♻️ Chores

* update dependencies and refactor resizable components for improved functionality ([c108b86](https://github.com/carlonicora/nextjs-jsonapi/commit/c108b86c8800c79a80ab76cd5aa7bceedb14b7d5))

## [1.39.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.39.0...v1.39.1) (2026-01-25)

### 💎 Styles

* simplify JSX structure in ContentTitle component for improved readability ([dadcb46](https://github.com/carlonicora/nextjs-jsonapi/commit/dadcb4663109347c3001297c977fb58e8f9a22dc))

## [1.39.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.38.3...v1.39.0) (2026-01-25)

### 🚀 Features

* add fullBleed prop to PageContentContainer for flexible content styling ([a7388ee](https://github.com/carlonicora/nextjs-jsonapi/commit/a7388ee3b4cc92ab87a344cbbbd6428efc903967))
* add prioritizeFunctions prop to ContentTitle and SharedContext for flexible layout handling ([3235bac](https://github.com/carlonicora/nextjs-jsonapi/commit/3235bac066855fc37adf710e60ed93433d981cc5))

## [1.38.3](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.38.2...v1.38.3) (2026-01-22)

### 💎 Styles

* update page content container padding ([9477e70](https://github.com/carlonicora/nextjs-jsonapi/commit/9477e7049b6e1d6c7512fde8c8f8974748b5cd28))

## [1.38.2](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.38.1...v1.38.2) (2026-01-22)

### 🐛 Bug Fixes

* correct generate-web-modules ([d13b739](https://github.com/carlonicora/nextjs-jsonapi/commit/d13b7392709a8cb457d25590d3eecaaed3ea9917))

## [1.38.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.38.0...v1.38.1) (2026-01-20)

### 🐛 Bug Fixes

* correct redirection on login ([1308de0](https://github.com/carlonicora/nextjs-jsonapi/commit/1308de0ad24ee4c8292ed0a6981137eb16ed9546))

## [1.38.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.37.0...v1.38.0) (2026-01-19)

### 🚀 Features

* add stripe discount code ([f6e43c7](https://github.com/carlonicora/nextjs-jsonapi/commit/f6e43c7e4a9de2610b41ad8ea34b70ed99f41a03))

## [1.37.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.36.1...v1.37.0) (2026-01-19)

### 🚀 Features

* add loading state to MultiSelect component and update UserMultiSelect to utilize it ([88bf0e2](https://github.com/carlonicora/nextjs-jsonapi/commit/88bf0e22c310cfa53754bedc7bf4ac6a021b2ad7))

### 🚨 Tests

* add linting and test validation ([db61ec6](https://github.com/carlonicora/nextjs-jsonapi/commit/db61ec6a4fe474411216895cc40545a451ae383f))

## [1.36.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.36.0...v1.36.1) (2026-01-19)

### 🐛 Bug Fixes

* remove console logs ([630cadc](https://github.com/carlonicora/nextjs-jsonapi/commit/630cadc1aaa460cdeb7c4d593aaf57572a42fdfc))

## [1.36.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.35.0...v1.36.0) (2026-01-19)

### 🚀 Features

* add company deletion ([8994015](https://github.com/carlonicora/nextjs-jsonapi/commit/8994015c7ecad706e9f219cbf2726e4682fee969))

### 🐛 Bug Fixes

* extend user refresh ([dc1d971](https://github.com/carlonicora/nextjs-jsonapi/commit/dc1d9717c01da227f489f80ab86308521c95b882))

## [1.35.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.34.0...v1.35.0) (2026-01-18)

### 🚀 Features

* add shepherdjs onboarding ([faea314](https://github.com/carlonicora/nextjs-jsonapi/commit/faea314b4ff133111f71213875bee6ed8b3d28eb))
* add stripe trial subscription ([125b3f8](https://github.com/carlonicora/nextjs-jsonapi/commit/125b3f8454ce61e7aba9de6131c161d7de6247b2))

### 🐛 Bug Fixes

* correct overflow on cards ([40170c5](https://github.com/carlonicora/nextjs-jsonapi/commit/40170c5a563752e7ab173dcedddb6243272c4247))
* correct vitest output ([fd3afb7](https://github.com/carlonicora/nextjs-jsonapi/commit/fd3afb7ec330796a1a01ebd6a446fcda667da903))
* improve user refresh logic and handle early returns ([8d5b56c](https://github.com/carlonicora/nextjs-jsonapi/commit/8d5b56c3563188cf1e9df0bed752f247ceefe52f))
* remove token visualiser from generic header ([99d5e10](https://github.com/carlonicora/nextjs-jsonapi/commit/99d5e10d8f29e9e666f984d2af52692d5780fc0d))

## [1.34.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.33.0...v1.34.0) (2026-01-17)

### 🚀 Features

* update authentication cookies with fresh user data on user refresh ([27ff52f](https://github.com/carlonicora/nextjs-jsonapi/commit/27ff52f03fb1dec09a2d7de357aeb5fb10874749))

## [1.33.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.32.2...v1.33.0) (2026-01-17)

### 🚀 Features

* add price feature selection ([254f5e4](https://github.com/carlonicora/nextjs-jsonapi/commit/254f5e48a67f1c47254a6d51824fd2a614973b99))
* add total to jsonapi list ([e6d7c71](https://github.com/carlonicora/nextjs-jsonapi/commit/e6d7c71f0d4b8fdd4819597d5c15769f54dd61e1))
* add-feature-sync-subscription-lifecycle ([9eee718](https://github.com/carlonicora/nextjs-jsonapi/commit/9eee7181bb705ded84604512e8b2d1840e633ec6))

### 🐛 Bug Fixes

* add administrator role check to subscription status ([4180c40](https://github.com/carlonicora/nextjs-jsonapi/commit/4180c40ac7ff87b0f549d4b4c00c8cd013761450))
* correct checkPermission with async call ([e66deaf](https://github.com/carlonicora/nextjs-jsonapi/commit/e66deafb146f69718796ee99730b43998320fe55))
* correct overflow ([08cffdc](https://github.com/carlonicora/nextjs-jsonapi/commit/08cffdc1d95ac0a92c01869b1b8b84b5f2e989b8))
* persist user in local storage on user refresh ([7f722a0](https://github.com/carlonicora/nextjs-jsonapi/commit/7f722a08f312ec9855be41e5781ef36425ebc18d))

## [1.32.2](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.32.1...v1.32.2) (2026-01-15)

### 🐛 Bug Fixes

* update third party login configuration ([1987af0](https://github.com/carlonicora/nextjs-jsonapi/commit/1987af06ac49ce5ebc5b993906b884a893f0047e))

## [1.32.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.32.0...v1.32.1) (2026-01-15)

### 🐛 Bug Fixes

* correct base-ui requirement ([fd705a2](https://github.com/carlonicora/nextjs-jsonapi/commit/fd705a2555524ede7777174ed24aaab6868d4be2))

## [1.32.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.31.1...v1.32.0) (2026-01-14)

### 🚀 Features

* add google oauth ([c95a903](https://github.com/carlonicora/nextjs-jsonapi/commit/c95a903482501b80ad115790ec48369654dd41c3))

## [1.31.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.31.0...v1.31.1) (2026-01-14)

### 🐛 Bug Fixes

* correct GDPR ([5a49c8b](https://github.com/carlonicora/nextjs-jsonapi/commit/5a49c8b8861df8a92a181dd7f4659aee5f913eed))

## [1.31.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.30.0...v1.31.0) (2026-01-14)

### 🚀 Features

* **auth:** add GDPR consent components and registration updates ([1f6b199](https://github.com/carlonicora/nextjs-jsonapi/commit/1f6b1997d048137b8300dad7389ad2fbf6895651))

## [1.30.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.29.6...v1.30.0) (2026-01-14)

### 🚀 Features

* add mdx support ([5be6548](https://github.com/carlonicora/nextjs-jsonapi/commit/5be654810afda644d705e4485988648698f4a0f6))

### 🐛 Bug Fixes

* correct internationalisation ([7d97005](https://github.com/carlonicora/nextjs-jsonapi/commit/7d97005f44a9b7325041c8623fa51300cf9a09d5))

## [1.29.6](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.29.5...v1.29.6) (2026-01-14)

### 📦 Code Refactoring

* refactor toast system ([e86f97b](https://github.com/carlonicora/nextjs-jsonapi/commit/e86f97b117c6f707ee150a9367c5484dfa90c4c5))

## [1.29.5](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.29.4...v1.29.5) (2026-01-11)

### 🐛 Bug Fixes

* correct recurring notification loading ([4273477](https://github.com/carlonicora/nextjs-jsonapi/commit/4273477e5a27e2f4ee3fd31158e3339dfc999475))

## [1.29.4](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.29.3...v1.29.4) (2026-01-11)

### 🐛 Bug Fixes

* prevent concurrent pagination calls in useDataListRetriever ([4c8ecee](https://github.com/carlonicora/nextjs-jsonapi/commit/4c8ecee753193803a073ef96d1784c40a60c4180))

## [1.29.3](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.29.2...v1.29.3) (2026-01-10)

### 🐛 Bug Fixes

* correct internationalisation ([f45acdb](https://github.com/carlonicora/nextjs-jsonapi/commit/f45acdb4a395d22104712dae76ae2472d30f34b6))

## [1.29.2](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.29.1...v1.29.2) (2026-01-09)

### 🐛 Bug Fixes

* include response status in error messages for better debugging ([91d9054](https://github.com/carlonicora/nextjs-jsonapi/commit/91d9054cb2297f5da5775a08412ac4aae0c82a37))

### 📦 Code Refactoring

* replace crypto.randomUUID with uuid.v4 for ID generation ([76dbaac](https://github.com/carlonicora/nextjs-jsonapi/commit/76dbaac2129a0b619415bcc2c0d76e8492534eed))

## [1.29.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.29.0...v1.29.1) (2026-01-09)

### 💎 Styles

* correct padding ([4ab53e4](https://github.com/carlonicora/nextjs-jsonapi/commit/4ab53e4e648b517cf8c1b0bc91acece418abb37e))
* correct padding ([498c39f](https://github.com/carlonicora/nextjs-jsonapi/commit/498c39f94e34b6c0b2b09f257c23cd7ca74a5a0a))
* correct padding ([3a7142c](https://github.com/carlonicora/nextjs-jsonapi/commit/3a7142ccf2c820fb720bd81c6bdbd4fecd2a7adf))

## [1.29.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.28.0...v1.29.0) (2026-01-09)

### 🚀 Features

* add isActiveSubscription property to Company interface and implementation ([29d1d9c](https://github.com/carlonicora/nextjs-jsonapi/commit/29d1d9c3a41949c733600ffb0d746a5352e09d16))
* add subscription confirmation step ([60cb4b0](https://github.com/carlonicora/nextjs-jsonapi/commit/60cb4b0f831737b801a6d0d1ff3e0634583a5fe9))
* add subscription trial enforcement ([1615400](https://github.com/carlonicora/nextjs-jsonapi/commit/1615400e7d168004b06d7d7997d2085068895f4c))
* add token status cta buttons ([0609dcb](https://github.com/carlonicora/nextjs-jsonapi/commit/0609dcbd972e75db90f2e546ff78e72851dfa837))

### 🐛 Bug Fixes

* correct product and pricing sorting ([25d4c3d](https://github.com/carlonicora/nextjs-jsonapi/commit/25d4c3df55d8e9296febfba7f9f221083b1eff01))
* enhance FormSelect and PriceEditor components; enforce description requirement in ProductEditor ([ff4f299](https://github.com/carlonicora/nextjs-jsonapi/commit/ff4f2995018676eec2ca195d693e980646bdc86e))
* remove unused attributes from Auth createJsonApi method ([b961040](https://github.com/carlonicora/nextjs-jsonapi/commit/b961040c675c8d8752d25a86c3a972a28d9a892d))

### 📦 Code Refactoring

* add billing subscription wizard ([661b098](https://github.com/carlonicora/nextjs-jsonapi/commit/661b0980ac4fe5782c0fd05fbe33583f5e276774))
* update subscription pricing ui ([1e6d134](https://github.com/carlonicora/nextjs-jsonapi/commit/1e6d1345e25173c9d09c26d76a2c8cce47c80fa3))

## [1.28.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.27.0...v1.28.0) (2026-01-08)

### 🚀 Features

* add tokens to price ([f617bbf](https://github.com/carlonicora/nextjs-jsonapi/commit/f617bbfb7cb73d0ecc5765b70b9088ed1e1c7025))

## [1.27.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.26.0...v1.27.0) (2026-01-08)

### 🚀 Features

* add HeaderChildrenContext for customizable header content ([f5e1952](https://github.com/carlonicora/nextjs-jsonapi/commit/f5e1952fd7a3fc6829e35b1db1e77f02672f816c))

## [1.26.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.25.1...v1.26.0) (2026-01-08)

### 🚀 Features

* add token status indicator ([ea86dd4](https://github.com/carlonicora/nextjs-jsonapi/commit/ea86dd47c6f02ad5f12b0ce3505780aa3cecc435))
* listen for token update WebSocket events in CurrentUserContext ([a7253d1](https://github.com/carlonicora/nextjs-jsonapi/commit/a7253d1fb6994d6adf54696c96e504980e672e77))

### 🐛 Bug Fixes

* remove company license ([28d52ce](https://github.com/carlonicora/nextjs-jsonapi/commit/28d52ce2523a6bff116c3de40c34a962e3d8e374))

## [1.25.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.25.0...v1.25.1) (2026-01-07)

### 🐛 Bug Fixes

* implement OAuth client state management atoms ([009f313](https://github.com/carlonicora/nextjs-jsonapi/commit/009f313498d25c10fdf37d18ec70e8c9202c13e9))

## [1.25.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.24.3...v1.25.0) (2026-01-07)

### 🚀 Features

* add OAuth support ([e806952](https://github.com/carlonicora/nextjs-jsonapi/commit/e80695258d81d5bef0548a22ce8e7c835765bdc1))

## [1.24.3](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.24.2...v1.24.3) (2026-01-07)

### 📦 Code Refactoring

* add form components to use FormFieldWrapper for improved structure and consistency ([5a23048](https://github.com/carlonicora/nextjs-jsonapi/commit/5a23048e35dcbe994c9fcbe5016fcd9a993eee9e))
* replace FormContainerGeneric with FormFieldWrapper for improved component structure ([e092b54](https://github.com/carlonicora/nextjs-jsonapi/commit/e092b54e3a395ae84f80d3e46505b9f894c8fecc))

## [1.24.2](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.24.1...v1.24.2) (2026-01-07)

### 🐛 Bug Fixes

* add autoSaveId to ResizablePanelGroup for improved state management ([53d44b9](https://github.com/carlonicora/nextjs-jsonapi/commit/53d44b9a8d24332e3d672c7f1ba288d2a32e8045))
* correct tests ([251de17](https://github.com/carlonicora/nextjs-jsonapi/commit/251de1718a0217bc76039a81d62d96efa3ec757f))
* update Resizable components to use correct props and improve functionality ([78861d9](https://github.com/carlonicora/nextjs-jsonapi/commit/78861d983a88f6a0cbaa0536075f04c0f8852f03))

## [1.24.1](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.24.0...v1.24.1) (2026-01-07)

### ♻️ Chores

* update dependencies and improve Resizable components for better performance ([93d1dbf](https://github.com/carlonicora/nextjs-jsonapi/commit/93d1dbfc1617932f8941f8385287045842ce11d0))

## [1.24.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.23.0...v1.24.0) (2026-01-07)

### 🚀 Features

* add separate entry point for billing components to optimize loading ([ca0c500](https://github.com/carlonicora/nextjs-jsonapi/commit/ca0c50028e6cc25148b87fd454e926ac0ef670d3))

## [1.23.0](https://github.com/carlonicora/nextjs-jsonapi/compare/v1.22.0...v1.23.0) (2026-01-05)

### 🚀 Features

* update PopoverTrigger usage in FormDate and FormDateTime components for improved rendering ([1dcd69f](https://github.com/carlonicora/nextjs-jsonapi/commit/1dcd69fe03a0aedbc540c7d5725b19c90f98278a))

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
